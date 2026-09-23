$path = 'e:\AI\prompt-project\apps\app-web\dist\app-web.umd.js'
$stream = [System.IO.File]::OpenRead($path)
$reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
$buf = New-Object char[] 1500
$null = $reader.Read($buf, 0, 1500)
$reader.Close()
Write-Host ([string]::new($buf))
