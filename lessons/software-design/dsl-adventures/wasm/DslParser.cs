using Parlot.Fluent;
using static Parlot.Fluent.Parsers;
namespace ParlotAdventure.Wasm;
public sealed record DslCommand(string Verb,string Text="",int Amount=0)
{
 public override string ToString()=>Amount!=0?$"{Verb} {Amount}":Text.Length>0?$"{Verb} {Text}":Verb;
}
public static class DslParser
{
 private static readonly Parser<string> Direction=Terms.Text("north",true).Or(Terms.Text("south",true)).Or(Terms.Text("east",true)).Or(Terms.Text("west",true));
 private static readonly Parser<(string,string)> Go=Terms.Text("go",true).And(Direction);
 private static readonly Parser<(string,long)> Number=Terms.Text("forward",true).Or(Terms.Text("back",true)).Or(Terms.Text("left",true)).Or(Terms.Text("right",true)).And(Terms.Integer());
 public static DslCommand Parse(string source,bool turtle){
   var s=source.Trim();
   if(s.Length>150)throw new FormatException("Command exceeds 150 characters.");
   if(turtle){
    if(s.Equals("pen down",StringComparison.OrdinalIgnoreCase))return new("pen down");
    if(s.Equals("pen up",StringComparison.OrdinalIgnoreCase))return new("pen up");
    if(Number.TryParse(s,out var n)&&s.Equals(n.Item1+" "+n.Item2,StringComparison.OrdinalIgnoreCase)&&n.Item2>=0&&n.Item2<=360)return new(n.Item1,Amount:(int)n.Item2);
   }else{
    if(Go.TryParse(s,out var move)&&s.Equals("go "+move.Item2,StringComparison.OrdinalIgnoreCase))return new("go",move.Item2);
    foreach(var word in new[]{"look","inventory","take key","open gate"})if(s.Equals(word,StringComparison.OrdinalIgnoreCase))return new(word);
    if(s.StartsWith("say ",StringComparison.OrdinalIgnoreCase)&&s.Length>4)return new("say",s[4..]);
   }
   throw new FormatException("Unknown or invalid command: "+s);
 }
}