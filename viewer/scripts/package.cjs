'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
require('./stage.cjs');
(async()=>{
  const {packager}=await import('@electron/packager');
  const {flipFuses,FuseVersion,FuseV1Options}=await import('@electron/fuses');
  const root=path.join(__dirname,'..');
  const tools=path.join(root,'.stage','reader-tools');
  await fs.mkdir(tools,{recursive:true});
  await fs.copyFile(path.join(__dirname,'NetworkGuard.ps1'),path.join(tools,'NetworkGuard.ps1'));
  const dirs=await packager({dir:root,name:'OfflineBookReader',executableName:'OfflineBookReader',platform:'win32',arch:'x64',out:path.join(root,'dist'),overwrite:true,asar:true,prune:true,
    ignore:[/^\/dist(?:\/|$)/,/^\/\.stage(?:\/|$)/,/^\/test(?:\/|$)/,/^\/scripts(?:\/|$)/,/^\/package-lock\.json$/],
    extraResource:[tools],
    win32metadata:{ProductName:'Offline Book Reader',FileDescription:'Offline HTML book reader'}
  });
  for(const dir of dirs){
    await flipFuses(path.join(dir,'OfflineBookReader.exe'),{
      version:FuseVersion.V1,
      [FuseV1Options.RunAsNode]:false,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]:false,
      [FuseV1Options.EnableNodeCliInspectArguments]:false,
      [FuseV1Options.OnlyLoadAppFromAsar]:true,
      [FuseV1Options.GrantFileProtocolExtraPrivileges]:false
    });
    await fs.copyFile(path.join(root,'README.md'),path.join(dir,'READ-ME-FIRST.md'));
    await fs.writeFile(path.join(dir,'Enable-Network-Block.cmd'),'@echo off\r\n"%SystemRoot%\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0resources\\reader-tools\\NetworkGuard.ps1" -Mode Install -ExecutablePath "%~dp0OfflineBookReader.exe"\r\nif errorlevel 1 (echo Setup failed. Read the message above.) else (echo Network block verified. Start OfflineBookReader.exe normally.)\r\npause\r\n');
    await fs.writeFile(path.join(dir,'Check-Network-Block.cmd'),'@echo off\r\n"%SystemRoot%\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0resources\\reader-tools\\NetworkGuard.ps1" -Mode Verify -ExecutablePath "%~dp0OfflineBookReader.exe"\r\npause\r\n');
    console.log('Packaged reader:',dir);
  }
})().catch(error=>{console.error(error);process.exitCode=1});
