param(
    [ValidateSet('Install','Verify','LocalFile')][string]$Mode = 'Verify',
    [Parameter(Mandatory=$true)][string]$ExecutablePath
)
$ErrorActionPreference = 'Stop'
# This script uses only local Windows APIs; it does not make connectivity probes.
function Assert-LocalPath([string]$Value) {
    if ($Value -notmatch '^[A-Za-z]:\\' -or $Value.Substring(2).Contains(':')) { throw 'A local drive path is required.' }
    $root = $Value.Substring(0,2)
    $drive = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='$root'"
    if (-not $drive -or [int]$drive.DriveType -notin @(2,3,5,6)) { throw 'Network and unrecognized drives are not allowed.' }
}
try {
    Assert-LocalPath $ExecutablePath
    if ($Mode -eq 'LocalFile') { Write-Output 'LOCAL'; exit 0 }
    $exe = [IO.Path]::GetFullPath($ExecutablePath)
    if (-not (Test-Path -LiteralPath $exe -PathType Leaf)) { throw 'Reader executable not found.' }
    $sha = [Security.Cryptography.SHA256]::Create()
    try { $hash = ([BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($exe.ToLowerInvariant())))).Replace('-','').Substring(0,16) } finally { $sha.Dispose() }
    $prefix = "OfflineBookReader-$hash"
    if ($Mode -eq 'Install') {
        $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
        $principal = New-Object Security.Principal.WindowsPrincipal($identity)
        if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { throw 'Run Enable-Network-Block.cmd as administrator.' }
        foreach ($direction in @('Inbound','Outbound')) {
            $name = "$prefix-$direction"
            $existing = Get-NetFirewallRule -PolicyStore PersistentStore -Name $name -ErrorAction SilentlyContinue
            if ($existing) { $existing | Remove-NetFirewallRule }
            New-NetFirewallRule -PolicyStore PersistentStore -Name $name -DisplayName "Offline Book Reader $direction ($hash)" -Group 'Offline Book Reader' -Program $exe -Direction $direction -Action Block -Enabled True -Profile Any -Protocol Any -LocalAddress Any -RemoteAddress Any -InterfaceType Any | Out-Null
        }
    }
    if ((Get-Service MpsSvc).Status -ne 'Running') { throw 'Windows Firewall service is not running.' }
    $profiles = @(Get-NetFirewallProfile -PolicyStore ActiveStore)
    if ($profiles.Count -ne 3 -or @($profiles | Where-Object { $_.Enabled -ne $true }).Count -gt 0) { throw 'Windows Firewall must be enabled for all profiles.' }
    foreach ($direction in @('Inbound','Outbound')) {
        $r = Get-NetFirewallRule -PolicyStore ActiveStore -Name "$prefix-$direction" -ErrorAction Stop
        if ($r.Enabled -ne 'True' -or $r.Action -ne 'Block' -or $r.Direction -ne $direction -or $r.Profile -ne 'Any' -or $r.PrimaryStatus -ne 'OK') { throw "Invalid $direction block rule." }
        $a = $r | Get-NetFirewallApplicationFilter
        $p = $r | Get-NetFirewallPortFilter
        $ip = $r | Get-NetFirewallAddressFilter
        $it = $r | Get-NetFirewallInterfaceTypeFilter
        $iface = $r | Get-NetFirewallInterfaceFilter
        $svc = $r | Get-NetFirewallServiceFilter
        if ($a.Program -ine $exe -or $p.Protocol -ne 'Any' -or $p.LocalPort -ne 'Any' -or $p.RemotePort -ne 'Any' -or $ip.LocalAddress -ne 'Any' -or $ip.RemoteAddress -ne 'Any' -or $it.InterfaceType -ne 'Any' -or $iface.InterfaceAlias -ne 'Any' -or $svc.Service -ne 'Any') { throw "Incomplete $direction block rule." }
    }
    Write-Output 'VERIFIED'
    exit 0
} catch {
    [Console]::Error.WriteLine($_.Exception.Message)
    exit 1
}
