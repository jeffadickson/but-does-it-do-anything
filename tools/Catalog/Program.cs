using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using Microsoft.Extensions.FileProviders;

public static class Catalog
{
    public static readonly string Root = FindRoot();
    static string FindRoot()
    {
        for (var d = new DirectoryInfo(AppContext.BaseDirectory); d != null; d = d.Parent)
            if (Directory.Exists(Path.Combine(d.FullName, "site")) && Directory.Exists(Path.Combine(d.FullName, "lessons"))) return d.FullName;
        throw new IOException("Cannot locate repository root");
    }
    static readonly HashSet<string> Topics = ["software-design", "software-testing", "languages-and-verification", "hardware", "mathematics"];
    static readonly Dictionary<string, string> Modes = new() { ["browser"] = "Runs in your browser", ["simulation"] = "Conceptual simulation", ["local-tools"] = "Requires local tools", ["hosted"] = "Requires a hosted service" };
    static bool Slug(string s) => Regex.IsMatch(s, @"\A[a-z0-9]+(?:-[a-z0-9]+)*\z");
    static JsonObject Read(string path) => JsonNode.Parse(File.ReadAllText(path)) as JsonObject ?? throw new InvalidDataException($"{path}: expected JSON object");
    static string S(JsonObject o, string k) => o[k]?.GetValue<string>() ?? throw new InvalidDataException($"Missing string {k}");
    static IEnumerable<string> Strings(JsonObject o, string k) => o[k]!.AsArray().Select(n => n!.GetValue<string>());
    public static string ValidatePath(string value)
    {
        if (string.IsNullOrEmpty(value) || value.StartsWith('/') || value.Split('/').Contains("..") || value.Contains('\\') || value.Contains(':'))
            throw new InvalidDataException($"Unsafe relative path: {value}");
        return string.Join('/', value.Split('/').Where(p => p != "" && p != "."));
    }
    public static List<JsonObject> Collect(string root)
    {
        var lessons = new List<JsonObject>(); var ids = new HashSet<string>();
        var manifests = Directory.GetDirectories(Path.Combine(root, "lessons")).SelectMany(Directory.GetDirectories)
            .Select(d => Path.Combine(d, "lesson.json")).Where(File.Exists).Order(StringComparer.Ordinal);
        foreach (var manifest in manifests)
        {
            var data = Read(manifest);
            foreach (var field in new[] { "id", "title", "summary", "topic", "level", "mode", "entrypoint" })
                if (data[field] is not JsonValue v || !v.TryGetValue<string>(out var text) || string.IsNullOrWhiteSpace(text)) throw new InvalidDataException($"{manifest}: missing string {field}");
            var id = S(data, "id"); var topic = S(data, "topic"); var dir = Path.GetDirectoryName(manifest)!;
            if (!Slug(id) || !ids.Add(id)) throw new InvalidDataException($"{manifest}: invalid or duplicate id");
            if (!Topics.Contains(topic) || new DirectoryInfo(dir).Parent!.Name != topic || Path.GetFileName(dir) != id) throw new InvalidDataException($"{manifest}: directory must match topic/id");
            if (!Modes.ContainsKey(S(data, "mode"))) throw new InvalidDataException($"{manifest}: invalid execution mode");
            foreach (var field in new[] { "tags", "languages", "prerequisites" })
                if (data[field] is not JsonArray a || a.Any(n => n is not JsonValue v || !v.TryGetValue<string>(out var s) || string.IsNullOrWhiteSpace(s))) throw new InvalidDataException($"{manifest}: {field} must be an array of nonempty strings");
            var entry = ValidatePath(S(data, "entrypoint")); var app = Path.Combine(dir, "app");
            if (Path.GetExtension(entry) != ".html" || !File.Exists(Path.Combine(app, entry))) throw new InvalidDataException($"{manifest}: missing HTML entrypoint");
            CheckApp(app);
            data["url"] = $"lessons/{topic}/{id}/{entry}"; lessons.Add(data);
        }
        if (lessons.Count == 0) throw new InvalidDataException("No lessons found");
        return lessons;
    }
    static void CheckApp(string dir)
    {
        foreach (var item in new DirectoryInfo(dir).EnumerateFileSystemInfos())
        {
            if (item.Attributes.HasFlag(FileAttributes.ReparsePoint)) throw new InvalidDataException($"{item}: symlinks are not publishable");
            if (item is DirectoryInfo) CheckApp(item.FullName);
            else if (item.Name.StartsWith('.') || item.Extension is ".pem" or ".key") throw new InvalidDataException($"Unexpected private/config file in app: {item.Name}");
        }
    }
    static string Escape(string s) => s.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;").Replace("\"", "&quot;").Replace("'", "&#x27;");
    static void Copy(string source, string target)
    {
        Directory.CreateDirectory(target);
        foreach (var f in Directory.GetFiles(source)) File.Copy(f, Path.Combine(target, Path.GetFileName(f)));
        foreach (var d in Directory.GetDirectories(source)) Copy(d, Path.Combine(target, Path.GetFileName(d)));
    }
    static void WriteJson(string path, object value) => File.WriteAllText(path, JsonSerializer.Serialize(value, new JsonSerializerOptions { WriteIndented = true, Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping }) + "\n");
    public static string Build(string root)
    {
        var lessons = Collect(root); var config = Read(Path.Combine(root, "site/config.json")); var output = Path.Combine(root, "_site");
        if (Directory.Exists(output)) Directory.Delete(output, true);
        Directory.CreateDirectory(output); Copy(Path.Combine(root, "shared"), Path.Combine(output, "shared"));
        var cards = new List<string>();
        foreach (var l in lessons)
        {
            string V(string k) => Escape(S(l, k));
            Copy(Path.Combine(root, "lessons", S(l, "topic"), S(l, "id"), "app"), Path.Combine(output, "lessons", S(l, "topic"), S(l, "id")));
            var search = string.Join(' ', new[] { S(l, "title"), S(l, "summary") }.Concat(Strings(l, "tags")).Concat(Strings(l, "languages"))).ToLowerInvariant();
            cards.Add($"<article class=\"lesson-card\" data-topic=\"{V("topic")}\" data-mode=\"{V("mode")}\" data-search=\"{Escape(search)}\">\n<div class=\"card-meta\">{Escape(S(l, "topic").Replace('-', ' '))} · {V("level")}</div>\n<h2><a href=\"{V("url")}\">{V("title")}</a></h2>\n<p>{V("summary")}</p><div class=\"card-bottom\"><span class=\"badge\">{Escape(Modes[S(l, "mode")])}</span><span>{Escape(string.Join(", ", Strings(l, "languages")))}</span></div></article>");
        }
        var template = File.ReadAllText(Path.Combine(root, "site/index.template.html"));
        foreach (var key in new[] { "title", "tagline", "intro", "repository" }) template = template.Replace("{{" + key + "}}", Escape(S(config, key)));
        File.WriteAllText(Path.Combine(output, "index.html"), template.Replace("{{cards}}", string.Join('\n', cards)).Replace("{{count}}", lessons.Count.ToString()));
        WriteJson(Path.Combine(output, "catalog.json"), lessons); File.WriteAllText(Path.Combine(output, ".nojekyll"), ""); return output;
    }
    public static string Create(string root, string topic, string slug, string title)
    {
        if (!Topics.Contains(topic) || !Slug(slug)) throw new InvalidDataException("Use a supported topic and a lowercase-hyphenated slug");
        var destination = Path.Combine(root, "lessons", topic, slug);
        if (Directory.Exists(destination) || File.Exists(destination)) throw new InvalidDataException($"Already exists: {destination}");
        Copy(Path.Combine(root, "templates/lesson"), destination); var file = Path.Combine(destination, "lesson.json"); var data = Read(file);
        data["id"] = slug; data["topic"] = topic; data["title"] = title; WriteJson(file, data); return destination;
    }
    public static List<string> Audit(string root)
    {
        var errors = new List<string>(); var lessons = Path.Combine(root, "lessons"); var projects = Directory.GetFiles(lessons, "*.csproj", SearchOption.AllDirectories).Order(StringComparer.Ordinal).ToArray();
        if (projects.Length == 0) return ["No lesson C# projects found"];
        foreach (var project in projects)
        {
            var relative = Path.GetRelativePath(root, project);
            try
            {
                var targets = XDocument.Load(project).Descendants().Where(e => e.Name == "TargetFramework" || e.Name == "TargetFrameworks").SelectMany(e => e.Value.Split(';')).ToArray();
                if (targets.Length == 0) errors.Add($"{relative}: missing TargetFramework");
                foreach (var target in targets) if (target.Trim() != "net10.0") errors.Add($"{relative}: non-.NET-10 target '{target}'");
            }
            catch (System.Xml.XmlException e) { errors.Add($"{relative}: invalid XML: {e.Message}"); }
        }
        foreach (var pin in Directory.GetFiles(lessons, "global.json", SearchOption.AllDirectories).Order(StringComparer.Ordinal))
        {
            try
            {
                var version = Read(pin)["sdk"]?["version"]?.GetValue<string>();
                if (version == null || !Regex.IsMatch(version, @"\A10\.\d+\.\d+\z")) errors.Add($"{Path.GetRelativePath(root, pin)}: SDK {version} is not .NET 10");
            }
            catch (Exception e) when (e is JsonException or InvalidOperationException or InvalidDataException) { errors.Add($"{Path.GetRelativePath(root, pin)}: invalid SDK version pin: {e.Message}"); }
        }
        return errors;
    }
    public static async Task<int> Main(string[] args)
    {
        try
        {
            switch (args.FirstOrDefault())
            {
                case "check" when args.Length == 1: Console.WriteLine($"Validated {Collect(Root).Count} lesson(s)"); break;
                case "build" when args.Length == 1: Console.WriteLine($"Built {Build(Root)}"); break;
                case "new" when args.Length == 5 && args[3] == "--title": Console.WriteLine($"Created {Create(Root, args[1], args[2], args[4])} — edit the lesson before committing"); break;
                case "check-net10" when args.Length == 1:
                    var errors = Audit(Root); foreach (var error in errors) Console.Error.WriteLine($"ERROR: {error}"); if (errors.Count > 0) return 1;
                    Console.WriteLine($"Validated {Directory.GetFiles(Path.Combine(Root, "lessons"), "*.csproj", SearchOption.AllDirectories).Length} lesson C# projects and {Directory.GetFiles(Path.Combine(Root, "lessons"), "global.json", SearchOption.AllDirectories).Length} SDK pins: .NET 10 source-only compliance.");
                    Console.WriteLine("NOTE: Bundled WebAssembly binaries require a separate rebuild and browser verification."); break;
                case "serve" when args.Length == 1 || (args.Length == 3 && args[1] == "--port"):
                    var port = args.Length == 1 ? 8000 : int.Parse(args[2]); if (port is < 1 or > 65535) throw new ArgumentException("Port must be between 1 and 65535");
                    var output = Build(Root); var builder = WebApplication.CreateBuilder(); builder.Logging.ClearProviders(); builder.WebHost.UseUrls($"http://127.0.0.1:{port}");
                    await using (var app = builder.Build())
                    {
                        var files = new PhysicalFileProvider(output); app.UseDefaultFiles(new DefaultFilesOptions { FileProvider = files });
                        app.UseStaticFiles(new StaticFileOptions { FileProvider = files, ServeUnknownFileTypes = true, DefaultContentType = "application/octet-stream" });
                        Console.WriteLine($"Open http://localhost:{port} (Ctrl+C to stop)"); await app.RunAsync();
                    }
                    break;
                default: Console.Error.WriteLine("Usage: dotnet run --project tools/Catalog -- check|build|serve [--port PORT]|new TOPIC SLUG --title TITLE|check-net10"); return 2;
            }
            return 0;
        }
        catch (Exception e) when (e is InvalidDataException or IOException or ArgumentException or InvalidOperationException or JsonException or FormatException or OverflowException)
        { Console.Error.WriteLine($"Error: {e.Message}"); return 1; }
    }
}

