using sly.parser;
using sly.parser.generator;

namespace SlyTrial;

/// <summary>Syntax shape and physical UTF-16 range; no expression is evaluated.</summary>
public sealed record Node(string Kind,int Start,int End,IReadOnlyList<Node> Children);
/// <summary>Candidate recognition result. Construction failure is distinct from input rejection.</summary>
public sealed record Outcome(bool Accepted,Node? Node,string? Diagnostic);
/// <summary>Token spelling and physical position supplied by the candidate lexer.</summary>
public sealed record LocatedToken(string Text,int Start,int Line,int Column);
/// <summary>Experimental fragment interface, independent of simulation and production selection.</summary>
public static class Trial
{
    private static readonly Lazy<Parser<PortToken,Node>> Ports=new(()=>Build<PortToken>(new PortGrammar(),"card"));
    private static readonly Lazy<Parser<ExprToken,Node>> Expressions=new(()=>Build<ExprToken>(new ExprGrammar(),"formula"));
    private static readonly Lazy<Parser<ContextToken,Node>> Context=new(()=>Build<ContextToken>(new ContextGrammar(),"control"));
    /// <summary>Recognizes a single XSPICE card fragment.</summary>
    public static Outcome ParsePort(string input)=>Convert(Ports.Value.Parse(input));
    /// <summary>Recognizes an arithmetic expression fragment without evaluation.</summary>
    public static Outcome ParseExpression(string input)=>Convert(Expressions.Value.Parse(input));
    /// <summary>Probes the generated generic lexer's mode transitions without recognition or execution of commands.</summary>
    public static IReadOnlyList<LocatedToken> ContextTokens(string input)
    {
        var lexed=Context.Value.Lexer.Tokenize(input);
        if(lexed.IsError)throw new ArgumentException("Lexical rejection",nameof(input));
        return lexed.Tokens.MainTokens().Where(t=>!t.IsEOS).Select(t=>new LocatedToken(t.Value,t.Position.Index,t.Position.Line,t.Position.Column)).ToArray();
    }
    /// <summary>Recognizes an inert control-block fragment with generated lexical modes.</summary>
    public static Outcome ParseControl(string input)=>Convert(Context.Value.Parse(input));
    /// <summary>Returns candidate token positions without rewriting input.</summary>
    public static IReadOnlyList<LocatedToken> PortTokens(string input)
    {
        var lexed=Ports.Value.Lexer.Tokenize(input);
        if(lexed.IsError)throw new ArgumentException("Lexical rejection",nameof(input));
        return lexed.Tokens.MainTokens().Where(t=>!t.IsEOS).Select(t=>new LocatedToken(t.Value,t.Position.Index,t.Position.Line,t.Position.Column)).ToArray();
    }
    private static Parser<T,Node> Build<T>(object grammar,string root) where T:struct,Enum
    {
        var built=new ParserBuilder<T,Node>().BuildParser(grammar,ParserType.EBNF_LL_RECURSIVE_DESCENT,root);
        if(built.IsError)throw new InvalidOperationException(string.Join("; ",built.Errors));
        return built.Result;
    }
    private static Outcome Convert<T>(ParseResult<T,Node> parsed) where T:struct,Enum
        =>new(parsed.IsOk,parsed.IsOk?parsed.Result:null,parsed.IsError?string.Join("; ",parsed.Errors):null);
}
