using System;
using System.Collections.Generic;
using System.Linq;
using Parlot.Fluent;
using static Parlot.Fluent.Parsers;

// This executable companion uses actual Parlot 1.5.8, not the JavaScript browser model.
// One command per line; script-level execution is intentionally simple and inspectable.
var adventure = new Adventure();
foreach (var line in new[] { "LOOK", "TAKE KEY", "GO NORTH", "OPEN GATE", "GO EAST", "LOOK" })
{
    var command = Dsl.ParseAdventure(line);
    Console.WriteLine($"> {line}\n{adventure.Step(command)}");
}
Console.WriteLine("\nTurtle:");
var turtle = new Turtle();
foreach (var line in new[] { "PEN DOWN", "FORWARD 70", "RIGHT 90", "FORWARD 70" })
{
    var command = Dsl.ParseTurtle(line);
    Console.WriteLine($"> {line}\n{turtle.Step(command)}");
}

// Semantic command objects separate parsing from execution.
public abstract record Command;
public sealed record WordCommand(string Verb) : Command;
public sealed record MoveCommand(string Direction) : Command;
public sealed record SayCommand(string Message) : Command;
public sealed record NumericCommand(string Verb, int Argument) : Command;

public static class Dsl
{
    // Terms.Text and Or are parser combinators: parser construction is in C#.
    private static readonly Parser<string> Direction =
        Terms.Text("north", caseInsensitive: true)
            .Or(Terms.Text("south", caseInsensitive: true))
            .Or(Terms.Text("east", caseInsensitive: true))
            .Or(Terms.Text("west", caseInsensitive: true));

    private static readonly Parser<MoveCommand> Move =
        Terms.Text("go", caseInsensitive: true)
            .And(Direction)
            .Then(x => new MoveCommand(x.Item2));

    // The word token is deliberately constrained to avoid accepting unknown verbs.
    private static readonly Parser<string> AdventureVerb =
        Terms.Text("look", caseInsensitive: true)
            .Or(Terms.Text("inventory", caseInsensitive: true))
            .Or(Terms.Text("take key", caseInsensitive: true))
            .Or(Terms.Text("open gate", caseInsensitive: true));

    private static readonly Parser<string> TurtleVerb =
        Terms.Text("forward", caseInsensitive: true)
            .Or(Terms.Text("back", caseInsensitive: true))
            .Or(Terms.Text("left", caseInsensitive: true))
            .Or(Terms.Text("right", caseInsensitive: true));

    private static readonly Parser<NumericCommand> Numeric =
        TurtleVerb
            .And(Terms.Integer())
            .Then(x => new NumericCommand(x.Item1, checked((int)x.Item2)));

    // Full-line recognition prevents valid prefixes from silently consuming junk.
    public static Command ParseAdventure(string source)
    {
        var s = source.Trim();
        if (Move.TryParse(s, out var move) && IsWholeMove(s, move)) return move;
        foreach (var verb in new[] { "look", "inventory", "take key", "open gate" })
            if (s.Equals(verb, StringComparison.OrdinalIgnoreCase))
                return new WordCommand(verb);
        if (s.StartsWith("say ", StringComparison.OrdinalIgnoreCase) && s.Length > 4)
            return new SayCommand(s[4..]);
        throw new FormatException($"Unrecognized adventure command: {source}");
    }

    private static bool IsWholeMove(string source, MoveCommand move) =>
        source.Equals("go " + move.Direction, StringComparison.OrdinalIgnoreCase);

    public static Command ParseTurtle(string source)
    {
        var s = source.Trim();
        if (s.Equals("pen up", StringComparison.OrdinalIgnoreCase)) return new WordCommand("pen up");
        if (s.Equals("pen down", StringComparison.OrdinalIgnoreCase)) return new WordCommand("pen down");
        if (Numeric.TryParse(s, out var command) &&
            s.Equals(command.Verb + " " + command.Argument, StringComparison.OrdinalIgnoreCase) &&
            command.Argument >= 0 && command.Argument <= 360) return command;
        throw new FormatException($"Unrecognized turtle command: {source}");
    }
}

public sealed class Adventure
{
    private string _room = "meadow";
    private bool _key, _gate;
    public string Step(Command command) => command switch
    {
        WordCommand { Verb: "look" } => _room switch
        {
            "meadow" => "You see a brass key in the meadow.",
            "bridge" => "A locked gate lies east of the bridge.",
            _ => "You found the castle treasure!"
        },
        WordCommand { Verb: "inventory" } => _key ? "You have a key." : "Empty pack.",
        WordCommand { Verb: "take key" } => TakeKey(),
        WordCommand { Verb: "open gate" } => OpenGate(),
        MoveCommand movement => Go(movement.Direction),
        SayCommand say => "You say: " + say.Message,
        _ => "This command cannot run in the adventure."
    };
    private string TakeKey() { if (_room != "meadow") return "No key here."; _key = true; return "Key collected."; }
    private string OpenGate() { if (_room != "bridge" || !_key) return "The gate stays closed."; _gate = true; return "Gate unlocked."; }
    private string Go(string direction)
    {
        var next = (_room, direction) switch
        {
            ("meadow", "north") => "bridge",
            ("bridge", "south") => "meadow",
            ("bridge", "east") when _gate => "castle",
            ("castle", "west") => "bridge",
            _ => null
        };
        if (next is null) return "You cannot travel that way.";
        _room = next;
        return "Now at " + _room;
    }
}

public sealed class Turtle
{
    private double _x, _y, _angle;
    private bool _pen;
    public string Step(Command command)
    {
        switch (command)
        {
            case WordCommand { Verb: "pen up" }: _pen = false; break;
            case WordCommand { Verb: "pen down" }: _pen = true; break;
            case NumericCommand { Verb: "left" } c: _angle -= c.Argument; break;
            case NumericCommand { Verb: "right" } c: _angle += c.Argument; break;
            case NumericCommand { Verb: "forward" or "back" } c:
                var amount = c.Argument * (c.Verb == "back" ? -1 : 1);
                _x += Math.Cos(_angle * Math.PI / 180) * amount;
                _y += Math.Sin(_angle * Math.PI / 180) * amount;
                break;
            default: throw new InvalidOperationException("Unsupported turtle instruction");
        }
        return $"Position ({_x:F1}, {_y:F1}), angle {_angle:F0}, pen {(_pen ? "down" : "up")}";
    }
}
