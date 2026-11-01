#:property PublishAot=false
using System.Diagnostics;
using System.IO.Compression;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.RegularExpressions;

// Isolated verification copies source to the artifact drive because Catalog's
// established output layout is relative to its assembly. Source stays intact.
if(args is not [var repository,var artifacts] || !Directory.Exists(repository)||!Directory.Exists(artifacts))
    throw new ArgumentException("Usage: <existing repository> <existing artifacts>");
repository=Path.GetFullPath(repository);artifacts=Path.GetFullPath(artifacts);
var snapshot=Path.Combine(artifacts,"catalog-snapshot");Directory.CreateDirectory(snapshot);
foreach(var name in new[]{"site","shared","templates","lessons","DeepDives","DeepDivesKids","tools/Catalog","tests/Catalog.Tests"})
    Copy(Path.Combine(repository,name),Path.Combine(snapshot,name));
var temp=Path.Combine(artifacts,"test-temp");Directory.CreateDirectory(temp);
var site=Path.GetFullPath(Path.Combine(snapshot,"_site"));
if(!site.StartsWith(snapshot+Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase) ||
    Directory.Exists(site)&&(File.GetAttributes(site)&FileAttributes.ReparsePoint)!=0)throw new IOException("Unsafe generated-site location");
await Run("catalog-tests",snapshot,["run","--project","tests/Catalog.Tests"]);
await Run("catalog-check",snapshot,["run","--project","tools/Catalog","--","check"]);
await Run("catalog-build",snapshot,["run","--project","tools/Catalog","--","build"]);
var htmlName="2026-10-31-sly-csharp-parser-deep-dive.html";
var published=Path.Combine(site,"DeepDives",htmlName);
if(!File.Exists(published)||!File.ReadAllText(Path.Combine(site,"deepdives.json")).Contains(htmlName))throw new InvalidDataException("Report not discovered by catalog");
var html=File.ReadAllText(published);
var zipMatch=Regex.Match(html,"download=\"sly-csharp-lab.zip\" href=\"data:application/zip;base64,([A-Za-z0-9+/=]+)\"");
if(!zipMatch.Success)throw new InvalidDataException("Source download missing");
var zipBytes=Convert.FromBase64String(zipMatch.Groups[1].Value);
var archive=Path.Combine(artifacts,"download-as-published.zip");File.WriteAllBytes(archive,zipBytes);
var digest=Convert.ToHexStringLower(SHA256.HashData(zipBytes));
if(!html.Contains("id=\"zip-hash\">"+digest))throw new InvalidDataException("Archive checksum mismatch");
using(var zip=new ZipArchive(new MemoryStream(zipBytes)))
    foreach(var entry in zip.Entries)
        if(entry.FullName.StartsWith('/')||entry.FullName.Split('/').Contains("..")||Path.GetExtension(entry.FullName) is ".dll" or ".exe" or ".pdb" or ".nupkg")throw new InvalidDataException("Unsafe/non-source archive entry");
var extracted=Path.Combine(artifacts,"download-replay-"+Guid.NewGuid().ToString("N"));
Directory.CreateDirectory(extracted);ZipFile.ExtractToDirectory(archive,extracted);
await Run("downloaded-lab-tests",extracted,["test","SlyTrial.Tests","--artifacts-path",Path.Combine(artifacts,"download-build"),"-p:RestoreLockedMode=true","--nologo"]);
File.WriteAllText(Path.Combine(artifacts,"integration-verification.json"),JsonSerializer.Serialize(new{
    status="passed",catalog_tests="passed",catalog_check="passed",catalog_build="passed",downloaded_lab_tests=30,
    source_zip_sha256=digest,generated_html_sha256=Hash(published),snapshot,site,
    limitations=new[]{"Catalog's existing suite and the extracted source archive were executed on Windows/.NET.","Visual browser checks and JS unit tests are separate evidence."}},new JsonSerializerOptions{WriteIndented=true}));
Console.WriteLine("Catalog and extracted source laboratory verified. Preview root: "+snapshot);
async Task Run(string name,string directory,string[] arguments)
{
    var start=new ProcessStartInfo("dotnet"){WorkingDirectory=directory,RedirectStandardOutput=true,RedirectStandardError=true,CreateNoWindow=true};
    start.Environment["TEMP"]=temp;start.Environment["TMP"]=temp;
    foreach(var argument in arguments)start.ArgumentList.Add(argument);
    using var process=Process.Start(start)!;var stdout=process.StandardOutput.ReadToEndAsync();var stderr=process.StandardError.ReadToEndAsync();
    await process.WaitForExitAsync();File.WriteAllText(Path.Combine(artifacts,name+".log"),await stdout+await stderr);
    if(process.ExitCode!=0)throw new IOException(name+" failed; inspect its artifact log");
}
static void Copy(string source,string target)
{
    if(!Directory.Exists(source))throw new DirectoryNotFoundException(source);
    Directory.CreateDirectory(target);
    foreach(var file in Directory.EnumerateFiles(source))if((File.GetAttributes(file)&FileAttributes.ReparsePoint)==0)File.Copy(file,Path.Combine(target,Path.GetFileName(file)),true);
    foreach(var directory in Directory.EnumerateDirectories(source))
        if((File.GetAttributes(directory)&FileAttributes.ReparsePoint)==0 && Path.GetFileName(directory) is not ("bin" or "obj" or "node_modules" or ".tools" or "_site" or ".git"))Copy(directory,Path.Combine(target,Path.GetFileName(directory)));
}
static string Hash(string path)=>Convert.ToHexStringLower(SHA256.HashData(File.ReadAllBytes(path)));
