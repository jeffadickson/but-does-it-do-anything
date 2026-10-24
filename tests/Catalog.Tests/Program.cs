using System.Text.Json.Nodes;
var root = Path.Combine(Path.GetTempPath(), "catalog-tests-" + Guid.NewGuid());
void Assert(bool condition, string message) { if (!condition) throw new Exception(message); }
void Reject(Action action) { try { action(); } catch (InvalidDataException) { return; } throw new Exception("Expected rejection"); }
void Copy(string source, string target) {
    Directory.CreateDirectory(target);
    foreach (var f in Directory.GetFiles(source)) File.Copy(f, Path.Combine(target, Path.GetFileName(f)));
    foreach (var d in Directory.GetDirectories(source)) if (Path.GetFileName(d) is not ("node_modules" or ".tools" or "bin" or "obj" or "__pycache__")) Copy(d, Path.Combine(target, Path.GetFileName(d)));
}
try {
    foreach (var dir in new[] { "site", "shared", "templates", "lessons" }) Copy(Path.Combine(Catalog.Root, dir), Path.Combine(root, dir));
    var path = Path.Combine(root, "lessons/software-design/facade/lesson.json"); var original = File.ReadAllText(path);
    void Edit(string key, JsonNode? value) { var data = JsonNode.Parse(original)!; data[key] = value; File.WriteAllText(path, data.ToJsonString()); }
    Edit("title", "<script>alert('x')</script> & \"test\"");
    var output = Catalog.Build(root); var html = File.ReadAllText(Path.Combine(output, "index.html"));
    Assert(html.Contains("&lt;script&gt;alert(&#x27;x&#x27;)"), "Escape HTML"); Assert(!html.Contains("<script>alert("), "No injected script");
    Assert(File.Exists(Path.Combine(output, "lessons/software-design/facade/index.html")), "Copy app"); Assert(!Directory.Exists(Path.Combine(output, "lessons/software-design/facade/tests")), "Exclude tests");
    foreach (var entry in new[] { "../README.html", "/index.html", "C:\\secrets.html", "nested/../../index.html" }) { Edit("entrypoint", entry); Reject(() => Catalog.Collect(root)); }
    Edit("mode", "pretend-real"); Reject(() => Catalog.Collect(root));
    Edit("tags", new JsonArray("")); Reject(() => Catalog.Collect(root)); File.WriteAllText(path, original);
    var secret = Path.Combine(root, "lessons/software-design/facade/app/secret.key"); File.WriteAllText(secret, "private"); Reject(() => Catalog.Collect(root)); File.Delete(secret);
    var count = Catalog.Collect(root).Count; Catalog.Create(root, "mathematics", "balance", "Balance an equation"); Catalog.Build(root);
    Assert(Catalog.Collect(root).Count == count + 1, "Discover new lesson"); Reject(() => Catalog.Create(root, "mathematics", "balance", "Overwrite"));
    Assert(Catalog.Audit(root).Count == 0, "Existing audit passes");
    var project = Path.Combine(root, "lessons/bad.csproj"); File.WriteAllText(project, "<Project><PropertyGroup><TargetFrameworks>net10.0;net8.0</TargetFrameworks></PropertyGroup></Project>");
    Assert(Catalog.Audit(root).Any(e => e.Contains("net8.0")), "Reject mixed frameworks"); File.WriteAllText(project, "<broken"); Assert(Catalog.Audit(root).Any(e => e.Contains("invalid XML")), "Reject malformed XML");
    var pin = Path.Combine(root, "lessons/global.json"); File.WriteAllText(pin, "{\"sdk\":{\"version\":\"8.0.100\"}}"); Assert(Catalog.Audit(root).Any(e => e.Contains("SDK 8.0.100")), "Reject old SDK");
    File.WriteAllText(pin, "{\"sdk\":null}"); Assert(Catalog.Audit(root).Any(e => e.Contains("SDK ")), "Reject missing SDK");
    Console.WriteLine("Passed catalog build, escaping, paths, metadata, private files, scaffolding and .NET audit regression tests.");
} finally { if (Directory.Exists(root)) Directory.Delete(root, true); }

