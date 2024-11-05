$vcvarspath = "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build"

chcp 65001
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
$global:OutputEncoding = [System.Text.Encoding]::UTF8
[console]::OutputEncoding = [System.Text.Encoding]::UTF8

pushd $vcvarspath
    cmd /c "vcvars32.bat&set" |
    foreach {
        if ($_ -match "=") {
            $v = $_.split("=", 2); set-item -force -path "ENV:\$($v[0])"  -value "$($v[1])" 
        }
    }
popd

$filename = [System.IO.Path]::GetFileNameWithoutExtension($args[1])
$filenameext = Split-Path -Leaf $args[1]
$filepath = Split-Path -Parent $args[1]

$filecontext = Get-Content -Raw -Encoding UTF8 -Path $args[1]

cl.exe /EHsc "$($args[1])" /Fe"$filepath\$filename" /Fo"$filepath\$filename"
& "$filepath\$filename.exe" | Out-String | Tee-Object  -Variable output
write-host;

if($args[0] -eq "run"){
}elseif ($args[0] -eq "export") {
    New-Item "$filepath/export" -Force -ItemType Directory > $null
    $context = "/*** $($args[2]) ***/`n/*** $filename ***/`n`n$filecontext`n`n/*** 実行結果`n`n$output`n`n ***/"
    Write-Output $context | Out-File -FilePath "$filepath\export\$filenameext" -Encoding UTF8

}elseif ($args[0] -eq "exportonly") {
    New-Item "$filepath/export" -Force -ItemType Directory > $null
    $context = "/*** $($args[2]) ***/`n/*** $filename ***/`n`n$filecontext"
    Write-Output $context | Out-File -FilePath "$filepath\export\$filenameext" -Encoding UTF8
}
