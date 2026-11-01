#:property PublishAot=false
using System.Diagnostics;
using System.IO.Compression;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

// Builds a deterministic, offline HTML article. The only executed inputs are
// fixed laboratory fixtures; metadata is never interpreted as a shell command.
if(args is not [var repository,var artifacts] || !Directory.Exists(repository) || !Directory.Exists(artifacts))
    throw new ArgumentException("Usage: <existing repository> <existing artifact directory>");
repository=Path.GetFullPath(repository);artifacts=Path.GetFullPath(artifacts);
var source=Path.Combine(repository,"docs/sly-deep-dive");
var lab=Path.Combine(source,"lab");
if(!Directory.Exists(lab)||!Directory.Exists(Path.Combine(repository,"DeepDives")))throw new DirectoryNotFoundException("Missing lesson sources");
var dll=Path.Combine(artifacts,"lab-build/bin/SlyTrial/debug/SlyTrial.dll");
if(!File.Exists(dll))throw new FileNotFoundException("Build and test the laboratory first",dll);
var recordings=new JsonArray();
foreach(var expression in new[]{"1+2*3","(1+2)*3","-(1+2)/3","2**3**2","v(in)-0.3","1+"})
{
    var start=new ProcessStartInfo("dotnet"){RedirectStandardOutput=true,RedirectStandardError=true,CreateNoWindow=true};
    foreach(var arg in new[]{dll,"expression",expression})start.ArgumentList.Add(arg);
    using var process=Process.Start(start)!;
    var stdout=process.StandardOutput.ReadToEndAsync();var stderr=process.StandardError.ReadToEndAsync();
    await process.WaitForExitAsync();
    var expected=expression=="1+"?1:0;
    if(process.ExitCode!=expected)throw new InvalidDataException($"Laboratory failed for {expression}: {await stderr}");
    recordings.Add(JsonNode.Parse(await stdout));
}
var options=new JsonSerializerOptions{WriteIndented=true};
File.WriteAllText(Path.Combine(artifacts,"recorded-asts.json"),recordings.ToJsonString(options));
var zipPath=Path.Combine(artifacts,"sly-csharp-lab.zip");
var files=Directory.EnumerateFiles(lab,"*",SearchOption.AllDirectories)
    .Where(p=>!p.Split(Path.DirectorySeparatorChar).Any(s=>s is "bin" or "obj"))
    .OrderBy(p=>Path.GetRelativePath(lab,p),StringComparer.Ordinal).ToArray();
using(var stream=File.Create(zipPath))
using(var zip=new ZipArchive(stream,ZipArchiveMode.Create))
    foreach(var file in files)
    {
        if((File.GetAttributes(file)&FileAttributes.ReparsePoint)!=0 || Path.GetFileName(file).StartsWith('.') ||
            Path.GetExtension(file) is not (".cs" or ".csproj" or ".json" or ".md"))
            throw new InvalidDataException("Only ordinary reviewed source files may enter the laboratory archive");
        var relative=Path.GetRelativePath(lab,file).Replace('\\','/');
        if(relative.StartsWith('/')||relative.Split('/').Contains(".."))throw new InvalidDataException("Unsafe archive entry");
        var entry=zip.CreateEntry(relative,CompressionLevel.Optimal);
        entry.LastWriteTime=new DateTimeOffset(2026,10,31,0,0,0,TimeSpan.Zero);
        using var target=entry.Open();using var input=File.OpenRead(file);input.CopyTo(target);
    }
var evidence=JsonNode.Parse(File.ReadAllText(Path.Combine(source,"evidence.json")))!;
var rows=evidence["comparison"]!["rows"]!.AsArray();
if(rows.Count!=29||evidence["tests"]!["passed"]!.GetValue<int>()!=30)throw new InvalidDataException("Evidence inventory changed; review article claims");
var table=new StringBuilder();
foreach(var row in rows)
{
    var scope=row!["Scope"]!.GetValue<string>();
    var candidate=row["candidate_accepted"]?.GetValue<bool>();var baseline=row["baseline_accepted"]?.GetValue<bool>();
    var label=scope=="unimplemented-production"?"Omitted":scope=="boundary-challenge"?"Boundary gap":"Match";
    var kind=scope=="unimplemented-production"?"gap":scope=="boundary-challenge"?"bad":"good";
    table.Append("<tr><td>").Append(WebUtility.HtmlEncode(row["Id"]!.GetValue<string>())).Append("</td><td>")
        .Append(WebUtility.HtmlEncode(row["Family"]!.GetValue<string>())).Append("</td><td>").Append(Accept(candidate))
        .Append("</td><td>").Append(Accept(baseline)).Append("</td><td><span class=\"status ").Append(kind).Append("\">")
        .Append(label).Append("</span></td></tr>\n");
}
var html=File.ReadAllText(Path.Combine(source,"template.html.txt"))
    .Replace("__LAB_ZIP__",Convert.ToBase64String(File.ReadAllBytes(zipPath)))
    .Replace("__ZIP_SHA__",Hash(zipPath))
    .Replace("__EVIDENCE_JSON__",evidence.ToJsonString(options))
    .Replace("__AST_JSON__",recordings.ToJsonString(options))
    .Replace("__EVIDENCE_ROWS__",table.ToString());
if(html.Contains("__LAB_")||html.Contains("__EVIDENCE_")||html.Contains("__AST_"))throw new InvalidDataException("Unfilled report placeholder");
var output=Path.Combine(repository,"DeepDives/2026-10-31-sly-csharp-parser-deep-dive.html");
File.WriteAllText(output,html,new UTF8Encoding(false));
File.WriteAllText(Path.Combine(artifacts,"build-manifest.json"),JsonSerializer.Serialize(new{
    html_sha256=Hash(output),zip_sha256=Hash(zipPath),source_files=files.Select(f=>new{path=Path.GetRelativePath(lab,f).Replace('\\','/'),sha256=Hash(f)}),
    recordings=recordings.Count,recorded_dll_sha256=Hash(dll),limitations=new[]{"Static recorded outcomes; the page does not run C#.","Archive contains source only; first restore downloads pinned NuGet dependencies."}},options));
Console.WriteLine(JsonSerializer.Serialize(new{output,source_files=files.Length,recordings=recordings.Count,zip_sha256=Hash(zipPath)}));
static string Accept(bool? value)=>value is true?"Accepted":value is false?"Rejected":"Unavailable";
static string Hash(string path)=>Convert.ToHexStringLower(SHA256.HashData(File.ReadAllBytes(path)));
