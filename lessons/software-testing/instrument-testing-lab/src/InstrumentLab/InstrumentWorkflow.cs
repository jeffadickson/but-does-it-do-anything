using System.Globalization;
using System.Net.Http.Json;
using Npgsql;
namespace InstrumentLab;
public interface IVisaInstrument {
    Task WriteAsync(string command, CancellationToken ct = default);
    Task<string> QueryAsync(string command, CancellationToken ct = default);
}
public interface IMeasurementStore {
    Task SaveAsync(Measurement reading, CancellationToken ct = default);
}
public sealed record Measurement(double FrequencyHz, double RawDbm, double CorrectionDb, double CorrectedDbm);
public sealed class CalibrationClient(HttpClient http) {
    public async Task<double> GetCorrectionAsync(double hz, CancellationToken ct = default) {
        using var response = await http.GetAsync("/api/calibration?frequencyHz=" + hz.ToString(CultureInfo.InvariantCulture), ct);
        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<CalibrationDto>(cancellationToken: ct)
            ?? throw new InvalidDataException("Empty calibration response");
        return result.CorrectionDb;
    }
    private sealed record CalibrationDto(double CorrectionDb);
}
public sealed class MeasurementWorkflow(IVisaInstrument generator, IVisaInstrument meter, CalibrationClient calibration, IMeasurementStore store) {
    public async Task<Measurement> RunAsync(double hz, CancellationToken ct = default) {
        if (!double.IsFinite(hz) || hz <= 0) throw new ArgumentOutOfRangeException(nameof(hz));
        await generator.WriteAsync("OUTP OFF", ct);
        try {
            await generator.WriteAsync("FREQ " + hz.ToString("G17", CultureInfo.InvariantCulture), ct);
            await generator.WriteAsync("POW -20 DBM", ct);
            await generator.WriteAsync("OUTP ON", ct);
            var raw = double.Parse(await meter.QueryAsync("MEAS:POW?", ct), CultureInfo.InvariantCulture);
            var correction = await calibration.GetCorrectionAsync(hz, ct);
            var reading = new Measurement(hz, raw, correction, raw + correction);
            await store.SaveAsync(reading, ct);
            return reading;
        } finally {
            await generator.WriteAsync("OUTP OFF", CancellationToken.None);
        }
    }
}
public sealed class PostgreSqlMeasurementStore(string connectionString) : IMeasurementStore {
    public async Task InitializeAsync(CancellationToken ct = default) {
        await using var db = new NpgsqlConnection(connectionString);
        await db.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand("CREATE TABLE IF NOT EXISTS measurements (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, frequency_hz double precision NOT NULL, raw_dbm double precision NOT NULL, correction_db double precision NOT NULL, corrected_dbm double precision NOT NULL)", db);
        await cmd.ExecuteNonQueryAsync(ct);
    }
    public async Task SaveAsync(Measurement m, CancellationToken ct = default) {
        await using var db = new NpgsqlConnection(connectionString);
        await db.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand("INSERT INTO measurements(frequency_hz,raw_dbm,correction_db,corrected_dbm) VALUES(@hz,@raw,@correction,@corrected)", db);
        cmd.Parameters.AddWithValue("hz", m.FrequencyHz);
        cmd.Parameters.AddWithValue("raw", m.RawDbm);
        cmd.Parameters.AddWithValue("correction", m.CorrectionDb);
        cmd.Parameters.AddWithValue("corrected", m.CorrectedDbm);
        await cmd.ExecuteNonQueryAsync(ct);
    }
}
