using sly.lexer;
using sly.parser.generator;
using sly.parser.parser;

namespace SlyTrial;

// These are deliberately separate lexical contexts: '-' belongs to a SPICE
// node name, but is an operator in an expression. No input is normalized.
internal enum PortToken
{
    [Lexeme(@"(?:\r\n|\r|\n)(?:[ \t]*\*[^\r\n]*(?:\r\n|\r|\n))*[ \t]*\+",true,true)] Continuation=1,
    [Lexeme(@"[ \t\f]+",true)] Space,
    [Lexeme(@"\r\n|\r|\n",false,true)] Eol,
    [Lexeme(@"%[vigh]d")] Differential,
    [Lexeme(@"%[A-Za-z_][A-Za-z_0-9]*")] Type,
    [Lexeme(@"\[")] OpenVector,
    [Lexeme(@"\]")] CloseVector,
    [Lexeme(@"\(")] Open,
    [Lexeme(@"\)")] Close,
    [Lexeme(@"~")] Invert,
    [Lexeme(@"[+-]?[0-9]+(?:\.[0-9]+)?")] Number,
    [Lexeme(@"[A-Za-z_@$\u0080-\uffff][A-Za-z_0-9.!@$:/\u0080-\uffff-]*")] Name
}

internal sealed class PortGrammar
{
    [Production("card : Name port tail")]
    public Node Card(Token<PortToken> instance,Node first,Node tail)
        =>new("xspice",instance.Position.Index,tail.End,[first,..tail.Children]);
    // Factor the named-node/model boundary rather than relying on a greedy
    // port+ repetition to give its last token back to the model production.
    [Production("tail : Name tail?")]
    public Node NamedTail(Token<PortToken> token,ValueOption<Node> rest)
        =>rest.Match(next=>new Node("tail",token.Position.Index,next.End,[Leaf("node",token),..next.Children]),
            ()=>new Node("tail",token.Position.Index,token.Position.Index+token.Value.Length,[Leaf("model",token)]));
    [Production("tail : Number tail")]
    public Node NumericTail(Token<PortToken> token,Node rest)=>new("tail",token.Position.Index,rest.End,[Leaf("node",token),..rest.Children]);
    [Production("tail : compound tail")]
    public Node CompoundTail(Node port,Node rest)=>new("tail",port.Start,rest.End,[port,..rest.Children]);
    [Production("port : node")]
    public Node Scalar(Node node)=>node;
    [Production("port : compound")]
    public Node Compound(Node port)=>port;
    [Production("compound : Invert port")]
    public Node Invert(Token<PortToken> invert,Node port)=>new("invert",invert.Position.Index,port.End,[port]);
    [Production("compound : OpenVector port+ CloseVector")]
    public Node Vector(Token<PortToken> open,List<Node> ports,Token<PortToken> close)=>Group("vector",open,close,ports);
    [Production("compound : Differential Open node node Close")]
    public Node Pair(Token<PortToken> type,Token<PortToken> open,Node positive,Node negative,Token<PortToken> close)
        =>Group(type.Value,type,close,[positive,negative]);
    [Production("compound : Differential node node")]
    public Node BarePair(Token<PortToken> type,Node positive,Node negative)=>new(type.Value,type.Position.Index,negative.End,[positive,negative]);
    [Production("compound : Type Open node Close")]
    public Node Typed(Token<PortToken> type,Token<PortToken> open,Node node,Token<PortToken> close)=>Group(type.Value,type,close,[node]);
    [Production("compound : Type node")]
    public Node BareTyped(Token<PortToken> type,Node node)=>new(type.Value,type.Position.Index,node.End,[node]);
    [Production("node : Name")]
    [Production("node : Number")]
    public Node Atom(Token<PortToken> token)=>Leaf("node",token);
    private static Node Leaf(string kind,Token<PortToken> token)=>new(kind,token.Position.Index,token.Position.Index+token.Value.Length,[]);
    private static Node Group(string kind,Token<PortToken> first,Token<PortToken> last,IReadOnlyList<Node> children)
        =>new(kind,first.Position.Index,last.Position.Index+last.Value.Length,children);
}

// Sly's built-in generic lexer supports modes too. This independent probe
// tests that capability; the regex fragment lexers above do not use it.
[Lexer(IgnoreWS=true,IgnoreEOL=true)]
internal enum ContextToken
{
    [Mode("default")]
    [Lexeme(GenericToken.Identifier,IdentifierType.Custom,"[A-Za-z_]","[A-Za-z_0-9-]")]
    Node=1,
    [Mode("default")][Sugar("{")][Push("expression")] Begin,
    [Mode("expression")][Sugar("}")][Pop] End,
    [Mode("expression")][AlphaNumId] Symbol,
    [Mode("expression")][Int] Number,
    [Mode("expression")][Sugar("(")] Open,
    [Mode("expression")][Sugar(")")] Close,
    [Mode("expression")][Sugar("-")] Minus,
    [Mode("default")][Sugar(".control")][Push("control")] Control,
    [Mode("control")][Sugar(".endc")][Pop] EndControl,
    [Mode("control")][UpTo("\r","\n")] Raw
}

internal sealed class ContextGrammar
{
    [Production("control : Control Raw* EndControl")]
    public Node Control(Token<ContextToken> begin,List<Token<ContextToken>> commands,Token<ContextToken> end)
        =>new("control",begin.Position.Index,end.Position.Index+end.Value.Length,
            commands.Select(c=>new Node("command",c.Position.Index,c.Position.Index+c.Value.Length,[])).ToArray());
}

internal enum ExprToken
{
    [Lexeme(@"[ \t\r\n]+",true)] Space=1,
    [Lexeme(@"(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?[A-Za-z]*")] Number,
    [Lexeme(@"[A-Za-z_@$][A-Za-z_0-9.$]*")] Name,
    [Lexeme(@"'[^'\r\n]*'")] Quoted,
    [Lexeme(@"\*\*")] Power,
    [Lexeme(@"\+")] Plus,
    [Lexeme(@"-")] Minus,
    [Lexeme(@"\*")] Times,
    [Lexeme(@"/")] Divide,
    [Lexeme(@"\(")] Open,
    [Lexeme(@"\)")] Close,
    [Lexeme(@"\{")] OpenBrace,
    [Lexeme(@"\}")] CloseBrace,
    [Lexeme(@",")] Comma
}

internal sealed class ExprGrammar
{
    [Production("formula : ExprGrammar_expressions")]
    public Node Formula(Node value)=>value;
    [Operation((int)ExprToken.Plus,Affix.InFix,Associativity.Left,10)]
    [Operation((int)ExprToken.Minus,Affix.InFix,Associativity.Left,10)]
    [Operation((int)ExprToken.Times,Affix.InFix,Associativity.Left,20)]
    [Operation((int)ExprToken.Divide,Affix.InFix,Associativity.Left,20)]
    [Operation((int)ExprToken.Power,Affix.InFix,Associativity.Right,30)]
    public Node Binary(Node left,Token<ExprToken> operation,Node right)=>new(operation.Value,left.Start,right.End,[left,right]);
    [Prefix((int)ExprToken.Minus,Associativity.Right,40)]
    [Prefix((int)ExprToken.Plus,Associativity.Right,40)]
    public Node Unary(Token<ExprToken> operation,Node value)=>new("unary"+operation.Value,operation.Position.Index,value.End,[value]);
    [Operand]
    [Production("atom : Number")]
    [Production("atom : Name")]
    [Production("atom : Quoted")]
    public Node Atom(Token<ExprToken> token)=>new(token.Value,token.Position.Index,token.Position.Index+token.Value.Length,[]);
    [Operand]
    [Production("group : Open ExprGrammar_expressions Close")]
    [Production("group : OpenBrace ExprGrammar_expressions CloseBrace")]
    public Node Group(Token<ExprToken> first,Node value,Token<ExprToken> last)=>new("group",first.Position.Index,last.Position.Index+1,[value]);
    [Operand]
    [Production("call : Name Open arguments Close")]
    public Node Call(Token<ExprToken> name,Token<ExprToken> open,Node args,Token<ExprToken> close)=>new("call:"+name.Value,name.Position.Index,close.Position.Index+1,args.Children);
    [Production("arguments : ExprGrammar_expressions")]
    public Node Argument(Node value)=>new("arguments",value.Start,value.End,[value]);
    [Production("arguments : ExprGrammar_expressions Comma arguments")]
    public Node Arguments(Node first,Token<ExprToken> comma,Node rest)=>new("arguments",first.Start,rest.End,[first,..rest.Children]);
}
