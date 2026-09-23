$ErrorActionPreference = 'Stop'

function Get-WebInfo {
  param([string]$Url, [int]$Max = 600)
  try {
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
    $req = [System.Net.HttpWebRequest]::Create($Url)
    $req.Method = 'GET'
    $req.Timeout = 8000
    $req.UserAgent = 'curl/8.0'
    $resp = $req.GetResponse()
    $stream = $resp.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
    $body = $reader.ReadToEnd()
    $reader.Close()
    Write-Host ("URL       : {0}" -f $Url)
    Write-Host ("Status    : {0} {1}" -f $resp.StatusCode, $resp.StatusDescription)
    Write-Host ("Type      : {0}" -f $resp.ContentType)
    Write-Host ("Length    : {0}" -f $body.Length)
    Write-Host "--- head ---"
    Write-Host ($body.Substring(0, [Math]::Min($Max, $body.Length)))
    Write-Host ""
  } catch {
    Write-Host ("URL       : {0}" -f $Url)
    Write-Host ("ERROR     : {0}" -f $_.Exception.Message)
    Write-Host ""
  }
}

Get-WebInfo -Url 'https://192.168.0.12:8888/app-web/' -Max 800
Get-WebInfo -Url 'https://192.168.0.12:8888/app-web/index.html' -Max 800
Get-WebInfo -Url 'https://192.168.0.12:8888/app-web/app-web.iife.js' -Max 400
Get-WebInfo -Url 'https://192.168.0.12:8888/app-web/app-web.css' -Max 400
