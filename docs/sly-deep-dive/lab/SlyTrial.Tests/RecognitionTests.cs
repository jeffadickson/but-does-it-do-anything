using FsCheck;
using FsCheck.Xunit;
using Xunit;

namespace SlyTrial.Tests;

public sealed class RecognitionTests
{
    [Theory]
    [InlineData("A1 in out gain",true)]
    [InlineData("a1 [~in out] gate",true)]
    [InlineData("a1 %vd(in 0) out diff",true)]
    [InlineData("a1 %my_udn(input) out custom",true)]
    [InlineData("a1 [in\n+ out] gate",true)]
    [InlineData("a1 [in out model",false)]
    [InlineData("a1 %vd(in) out diff",false)]
    [InlineData("a1 %vd(in 0 extra) out diff",false)]
    [InlineData("a1 [] out gate",false)]
    [InlineData("a1 model",false)]
    public void Port_grammar_obeys_the_declared_fragment_contract(string input,bool valid)
        =>Assert.Equal(valid,Trial.ParsePort(input).Accepted);

    [Theory]
    [InlineData("1+2*3",true)]
    [InlineData("-(1+2)/3",true)]
    [InlineData("v(in)-0.3",true)]
    [InlineData("exp(v(in)/vt)-1",true)]
    [InlineData("1+",false)]
    [InlineData("(1+2",false)]
    [InlineData("v(in))",false)]
    [InlineData("1 garbage",false)]
    public void Expression_grammar_obeys_the_declared_fragment_contract(string input,bool valid)
        =>Assert.Equal(valid,Trial.ParseExpression(input).Accepted);

    [Fact]
    public void Multiplication_binds_inside_addition()
    {
        var node=Trial.ParseExpression("1+2*3").Node!;
        Assert.Equal("+",node.Kind);Assert.Equal("*",node.Children[1].Kind);
    }

    [Fact]
    public void Continuation_keeps_original_physical_token_offsets()
    {
        var input="a1 [first\r\n+ second] model";
        Assert.Contains(Trial.PortTokens(input),t=>t.Text=="second" && t.Start==input.IndexOf("second",StringComparison.Ordinal));
    }

    [Fact]
    public void Builtin_modes_distinguish_node_hyphens_from_expression_subtraction()
    {
        var tokens=Trial.ContextTokens("in-node {v(g)-1} out-node");
        Assert.Equal(new[]{"in-node","{","v","(","g",")","-","1","}","out-node"},tokens.Select(t=>t.Text));
    }

    [Theory]
    [InlineData(".control\nshell echo forbidden\n.endc",true)]
    [InlineData(".control\necho \".endc\"\n.endc",true)]
    [InlineData(".control\nquit",false)]
    public void Control_records_are_inert_and_require_closure(string input,bool expected)
        =>Assert.Equal(expected,Trial.ParseControl(input).Accepted);

    [Fact]
    public void Shell_text_in_a_control_block_does_not_create_a_file()
    {
        var marker=Path.Combine(Path.GetTempPath(),"sly-inert-"+Guid.NewGuid().ToString("N"));
        Assert.False(File.Exists(marker));
        Assert.True(Trial.ParseControl($".control\nshell echo forbidden > {marker}\n.endc").Accepted);
        Assert.False(File.Exists(marker));
    }

    [Fact]
    public void Invalid_token_requests_produce_an_explicit_lexical_error()
    {
        var error=Assert.Throws<ArgumentException>(()=>Trial.PortTokens("a1 ^ out model"));
        Assert.Contains("Lexical",error.Message);Assert.Equal("input",error.ParamName);
    }

    [Fact]
    public void Context_token_requests_identify_lexical_errors()
    {
        var error=Assert.Throws<ArgumentException>(()=>Trial.ContextTokens("@"));
        Assert.Contains("Lexical",error.Message);Assert.Equal("input",error.ParamName);
    }

    [Fact]
    public void Recognition_results_do_not_expose_partial_nodes_on_failure()
    {
        foreach(var outcome in new[]{Trial.ParsePort("a1 [in] model"),Trial.ParseExpression("1+2"),Trial.ParseControl(".control\nquit\n.endc")})
        {
            Assert.True(outcome.Accepted);Assert.NotNull(outcome.Node);Assert.Null(outcome.Diagnostic);
        }
        foreach(var outcome in new[]{Trial.ParsePort("a1 [in model"),Trial.ParseExpression("1+"),Trial.ParseControl(".control\nquit")})
        {
            Assert.False(outcome.Accepted);Assert.Null(outcome.Node);Assert.NotEmpty(outcome.Diagnostic!);
        }
    }

    [Property(MaxTest=128,Replay="551,20261031")]
    public bool Generated_differential_pairs_parse_without_model_resolution(NonNegativeInt positive,NonNegativeInt negative)
        =>Trial.ParsePort($"a1 %vd({positive.Get} {negative.Get}) out model").Accepted;

    [Property(MaxTest=128,Replay="552,20261031")]
    public bool Bounded_malformed_text_returns_results_without_escaping(NonNull<string> value)
    {
        var input=value.Get[..Math.Min(128,value.Get.Length)];
        var ports=Trial.ParsePort(input);var expression=Trial.ParseExpression(input);
        return (ports.Accepted || ports.Diagnostic is not null) && (expression.Accepted || expression.Diagnostic is not null);
    }
}
