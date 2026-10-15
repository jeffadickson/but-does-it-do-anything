using System.Reflection;
using System.Runtime.InteropServices.JavaScript;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using System.Text.Json;
public partial class Runner {
    static readonly List<MetadataReference> Refs = new();
    public static void Main() {}
    [JSExport] public static void AddReference(string data) => Refs.Add(MetadataReference.CreateFromImage(Convert.FromBase64String(data)));
    [JSExport] public static async Task<string> Run(string code) {
        var output = new LimitedWriter(); var original = Console.Out; var originalError = Console.Error;
        Console.SetOut(output); Console.SetError(output);
        try {
            var tree = CSharpSyntaxTree.ParseText(code);
            var compilation = CSharpCompilation.Create("Lesson_" + Guid.NewGuid().ToString("N"), new[] {tree}, Refs, new CSharpCompilationOptions(OutputKind.ConsoleApplication, concurrentBuild: false));
            using var stream = new MemoryStream();
            var emitted = compilation.Emit(stream);
            if (!emitted.Success) return JsonSerializer.Serialize(new {output = output.ToString(), error = string.Join("\n", emitted.Diagnostics.Where(d => d.Severity == DiagnosticSeverity.Error))});
            var assembly = Assembly.Load(stream.ToArray());
            var entry = assembly.EntryPoint!;
            // Async Main has a generated blocking CLI wrapper; invoke the async method directly on WASM.
            var sourceEntry = compilation.GetEntryPoint(default)!;
            entry = entry.DeclaringType!.GetMethods(BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic)
                .FirstOrDefault(m => m.Name == sourceEntry.MetadataName && typeof(Task).IsAssignableFrom(m.ReturnType)) ?? entry;
            var result = entry.Invoke(null, entry.GetParameters().Length == 0 ? null : new object[] {Array.Empty<string>()});
            if(result is Task task) await task;
            return JsonSerializer.Serialize(new {output=output.ToString(), error=""});
        } catch(Exception e) {
            return JsonSerializer.Serialize(new {output=output.ToString(), error=(e.InnerException ?? e).ToString()});
        } finally { Console.SetOut(original); Console.SetError(originalError); }
    }
}

sealed class LimitedWriter : TextWriter {
    readonly System.Text.StringBuilder buffer = new();
    public override System.Text.Encoding Encoding => System.Text.Encoding.UTF8;
    public override void Write(char value) { if(buffer.Length >= 50000) throw new InvalidOperationException("Output limit reached"); buffer.Append(value); }
    public override void Write(string? value) { if(buffer.Length + (value?.Length ?? 0) > 50000) throw new InvalidOperationException("Output limit reached"); buffer.Append(value); }
    public override string ToString() => buffer.ToString();
}
