Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

function Take-Screenshot {
    param($name)
    $dest = "d:\work\wecaht app\workstreams\07-quality-review\evidence\2026-06-22\$name"
    $b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
    $bmp = New-Object System.Drawing.Bitmap($b.Width, $b.Height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.CopyFromScreen($b.Location, [System.Drawing.Point]::Empty, $b.Size)
    $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Saved: $dest"
}

function Focus-DevTools {
    $devtools = Get-Process wechatdevtools -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -ne '' } | Select-Object -First 1
    if (-not $devtools) {
        Write-Output "ERROR: DevTools not running"
        return $false
    }
    Write-Output "DevTools: PID=$($devtools.Id) Title=$($devtools.MainWindowTitle)"
    $hwnd = $devtools.MainWindowHandle
    Add-Type -Namespace W32 -Name User32 -MemberDefinition @'
[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
[DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
'@
    [W32.User32]::ShowWindow($hwnd, 9) | Out-Null
    Start-Sleep -Milliseconds 500
    [W32.User32]::SetForegroundWindow($hwnd) | Out-Null
    Start-Sleep -Milliseconds 1000
    Write-Output "DevTools focused"
    return $true
}

function Send-Key {
    param([string]$keys)
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.SendKeys]::SendWait($keys)
    Start-Sleep -Milliseconds 300
}

function Click-Screen {
    param([int]$x, [int]$y)
    Add-Type -Namespace W32 -Name Mouse -MemberDefinition @'
[DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y);
[DllImport("user32.dll")] public static extern void mouse_event(int dwFlags, int dx, int dy, int dwData, int dwExtraInfo);
'@
    [W32.Mouse]::SetCursorPos($x, $y)
    Start-Sleep -Milliseconds 100
    [W32.Mouse]::mouse_event(0x0002, 0, 0, 0, 0)  # MOUSEEVENTF_LEFTDOWN
    Start-Sleep -Milliseconds 100
    [W32.Mouse]::mouse_event(0x0004, 0, 0, 0, 0)  # MOUSEEVENTF_LEFTUP
    Start-Sleep -Milliseconds 300
}

# Main: Focus DevTools, take initial screenshot
Focus-DevTools
Take-Screenshot "qa-00-initial.png"
