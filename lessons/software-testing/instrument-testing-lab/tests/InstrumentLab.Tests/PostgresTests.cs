using InstrumentLab;
using Npgsql;
using Testcontainers.PostgreSql;
using Xunit;
namespace InstrumentLab.Tests;
public sealed class PostgresTests : IAsyncLifetime {
    private readonly PostgreSqlContainer db = new PostgreSqlBuilder("postgres:16-alpine").Build();
    public Task InitializeAsync() => db.StartAsync();
    public Task DisposeAsync() => db.DisposeAsync().AsTask();
    [Fact]
    public async Task Actually_persists_in_postgresql() {
        var store = new PostgreSqlMeasurementStore(db.GetConnectionString());
        await store.InitializeAsync();
        await store.SaveAsync(new Measurement(1_000_000, -21.5, 0.7, -20.8));
        await using var connection = new NpgsqlConnection(db.GetConnectionString());
        await connection.OpenAsync();
        await using var cmd = new NpgsqlCommand("SELECT corrected_dbm FROM measurements", connection);
        Assert.Equal(-20.8, (double)(await cmd.ExecuteScalarAsync())!, 8);
    }
}
