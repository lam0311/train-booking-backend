# Chạy semgrep để kiểm tra độ bảo mật cho dự án
# Right-click -> Run with PowerShell
# Hoặc ta có thể chạy trong terminal: .\run-semgrep.ps1

$env:PATH += ";C:\Users\ADMIN\AppData\Local\Python\pythoncore-3.14-64\Scripts"

Write-Host "OWASP Top 10" -ForegroundColor Yellow

semgrep --config owasp-top-ten.yaml src/ --text
