# Instalador da Fábrica de Criativos para Windows 10 e 11.
#
# Abra o PowerShell na pasta do projeto e rode:
#   powershell -ExecutionPolicy Bypass -File instalar\windows.ps1
#
# O que ele faz (e pula o que já estiver instalado, então pode rodar de novo sem medo):
#   1. Git, Node.js LTS, FFmpeg e uv pelo winget (o "Instalador de Aplicativo" da Microsoft)
#   2. npm install (three e Playwright) e o Chromium do Playwright
#   3. Whisper (openai-whisper), depois de perguntar: é grande
#   4. node fabrica.mjs verificar, que confere tudo no final
#
# Não precisa instalar Python: o uv baixa sozinho a versão que cada script pede.
# Para responder "sim" a tudo sem perguntar: powershell -ExecutionPolicy Bypass -File instalar\windows.ps1 -Sim

param([switch]$Sim)

# Cada programa é conferido pelo código de saída ($LASTEXITCODE); 'Stop' faria o aviso de um programa virar erro
$ErrorActionPreference = 'Continue'
try {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    $OutputEncoding = [System.Text.Encoding]::UTF8
} catch { }

function Titulo($texto) { Write-Host ""; Write-Host "== $texto" -ForegroundColor Cyan }
function Ok($texto)     { Write-Host "   [ok] $texto" -ForegroundColor Green }
function Aviso($texto)  { Write-Host "   [!] $texto" -ForegroundColor Yellow }
function Parar($texto) {
    Write-Host ""
    Write-Host "[erro] $texto" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# A pasta do projeto é a de cima de instalar\
$Raiz = Split-Path -Parent $PSScriptRoot
Set-Location $Raiz
if (-not (Test-Path (Join-Path $Raiz 'fabrica.mjs'))) {
    Parar "Não achei o fabrica.mjs em $Raiz. Rode este instalador de dentro da pasta do projeto."
}

Write-Host "Fábrica de Criativos: instalação no Windows" -ForegroundColor Cyan
Write-Host "Pasta do projeto: $Raiz"

# Lê de novo o PATH do sistema e do usuário, para achar o que acabou de ser instalado sem reabrir o terminal
function Atualizar-Path {
    $maquina = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $usuario = [Environment]::GetEnvironmentVariable('Path', 'User')
    $extras = @(
        (Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Links'),
        (Join-Path $env:USERPROFILE '.local\bin'),
        (Join-Path $env:ProgramFiles 'nodejs'),
        (Join-Path $env:ProgramFiles 'Git\cmd')
    )
    $env:Path = (@($maquina, $usuario) + $extras + @($env:Path) | Where-Object { $_ }) -join ';'
}

function Tem($comando) { return [bool](Get-Command $comando -ErrorAction SilentlyContinue) }

function Versao-Node {
    if (-not (Tem 'node')) { return 0 }
    $v = (& node --version) -replace '^v', ''
    return [int]($v.Split('.')[0])
}

# ---------------------------------------------------------------- 1. winget
Titulo "Conferindo o winget"
if (-not (Tem 'winget')) {
    Parar ("O winget não está instalado. Ele vem no app 'Instalador de Aplicativo' (App Installer) da Microsoft Store.`n" +
           "       Abra a Microsoft Store, procure por 'Instalador de Aplicativo', instale ou atualize,`n" +
           "       feche e abra o PowerShell e rode este instalador de novo.`n" +
           "       Link direto: https://apps.microsoft.com/detail/9NBLGGH4NNS1")
}
Ok "winget encontrado"

function Instalar-Winget($id, $nome, $comando) {
    if (Tem $comando) { Ok "$nome já instalado"; return }
    Write-Host "   instalando $nome ($id)..."
    & winget install -e --id $id --accept-source-agreements --accept-package-agreements
    $codigo = $LASTEXITCODE
    Atualizar-Path
    if (Tem $comando) { Ok "$nome instalado"; return }
    if ($codigo -ne 0) {
        Parar "O winget não conseguiu instalar $nome (código $codigo). Tente à mão: winget install -e --id $id"
    }
    Parar "$nome foi instalado, mas o comando '$comando' ainda não aparece. Feche e abra o PowerShell e rode este instalador de novo."
}

Titulo "Programas (Git, Node.js, FFmpeg, uv)"
Write-Host "   Se aparecer uma janela pedindo permissão de administrador, clique em Sim."
Atualizar-Path
Instalar-Winget 'Git.Git' 'Git' 'git'
Instalar-Winget 'OpenJS.NodeJS.LTS' 'Node.js LTS' 'node'
if ((Versao-Node) -lt 20) {
    Aviso "o Node instalado é antigo (precisa de 20 ou mais); atualizando para o LTS..."
    & winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    Atualizar-Path
    if ((Versao-Node) -lt 20) { Parar "O Node continua abaixo da versão 20. Desinstale o Node antigo em Configurações > Aplicativos e rode de novo." }
}
Ok ("Node " + (& node --version))
Instalar-Winget 'Gyan.FFmpeg' 'FFmpeg' 'ffmpeg'
Instalar-Winget 'astral-sh.uv' 'uv' 'uv'

# ---------------------------------------------------------------- 2. npm e Chromium
Titulo "Dependências do projeto (npm install)"
& npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { Parar "O npm install falhou. Confira a internet e rode de novo." }
Ok "three e Playwright instalados"

Titulo "Chromium do Playwright (o navegador que renderiza os filmes)"
& npx playwright install chromium
if ($LASTEXITCODE -ne 0) { Parar "Não consegui baixar o Chromium. Rode de novo: npx playwright install chromium" }
Ok "Chromium pronto"

# ---------------------------------------------------------------- 3. Whisper
Titulo "Whisper (marca o tempo de cada palavra da narração)"
$temWhisper = Tem 'whisper'
if (-not $temWhisper) {
    $lista = (& uv tool list 2>$null) -join "`n"
    if ($lista -match 'openai-whisper') { $temWhisper = $true }
}
if ($temWhisper) {
    Ok "Whisper já instalado"
} else {
    Write-Host "   O Whisper é grande: baixa uns 2 a 3 GB (PyTorch) e, no primeiro uso, mais o modelo de fala."
    Write-Host "   Sem ele a fábrica funciona, mas o demo e a narração no tempo das cenas não."
    $resposta = 's'
    if (-not $Sim) { $resposta = Read-Host "   Instalar o Whisper agora? [S/n]" }
    if ($resposta -eq '' -or $resposta -match '^[sSyY]') {
        & uv tool install --python 3.12 openai-whisper
        if ($LASTEXITCODE -ne 0) {
            Aviso "a instalação do Whisper falhou. Tente de novo depois: uv tool install --python 3.12 openai-whisper"
        } else {
            & uv tool update-shell | Out-Null
            Atualizar-Path
            Ok "Whisper instalado"
        }
    } else {
        Aviso "Whisper pulado. Para instalar depois: uv tool install --python 3.12 openai-whisper"
    }
}

# ---------------------------------------------------------------- 4. conferência
Titulo "Conferência final"
& node fabrica.mjs verificar
$final = $LASTEXITCODE
Write-Host ""
if ($final -eq 0) {
    Write-Host "Instalação concluída. Feche e abra o PowerShell (para o PATH novo valer em todo lugar) e rode:" -ForegroundColor Green
    Write-Host "   node fabrica.mjs demo"
} else {
    Write-Host "Quase lá: a conferência acima mostra o que falta e como resolver." -ForegroundColor Yellow
    Write-Host "Depois de resolver, feche e abra o PowerShell e rode: node fabrica.mjs verificar"
}
exit $final
