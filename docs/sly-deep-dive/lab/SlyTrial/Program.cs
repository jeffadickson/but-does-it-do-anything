using System.Text.Json;
using SlyTrial;

// The laboratory creates syntax only. In particular, control text is never
// sent to a shell, include loader, simulator or evaluator.
if(args is not [var family,var input] || family is not ("expression" or "port" or "control"))
{
    Console.Error.WriteLine("Usage: expression|port|control <quoted fragment>");
    return 2;
}
var result=family switch{"expression"=>Trial.ParseExpression(input),"port"=>Trial.ParsePort(input),_=>Trial.ParseControl(input)};
Console.WriteLine(JsonSerializer.Serialize(new{family,input,result},new JsonSerializerOptions{WriteIndented=true}));
return result.Accepted?0:1;
