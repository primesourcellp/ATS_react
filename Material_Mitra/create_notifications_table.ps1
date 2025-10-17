# PowerShell script to create notifications table
# Make sure MySQL is running and accessible

Write-Host "Creating notifications table..." -ForegroundColor Green

# MySQL connection details
$mysqlPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"  # Adjust path if needed
$username = "root"
$password = "root"  # Change this to your MySQL password
$database = "Material_Mitra"

# SQL commands
$sqlCommands = @"
USE Material_Mitra;

CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    \`read\` BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    related_entity_id BIGINT NULL,
    related_entity_type VARCHAR(100) NULL,
    INDEX idx_created_at (created_at),
    INDEX idx_read (\`read\`),
    INDEX idx_type (type),
    INDEX idx_related_entity (related_entity_id, related_entity_type)
);

INSERT INTO notifications (title, message, type, \`read\`, created_at) 
VALUES ('Welcome to ATS', 'Notification system is now working!', 'GENERAL', FALSE, NOW());

SELECT 'Notifications table created successfully!' as status;
"@

try {
    # Try to execute MySQL command
    if (Test-Path $mysqlPath) {
        $sqlCommands | & $mysqlPath -u $username -p$password
        Write-Host "✅ Notifications table created successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ MySQL not found at: $mysqlPath" -ForegroundColor Red
        Write-Host "Please run the SQL script manually in MySQL Workbench:" -ForegroundColor Yellow
        Write-Host "File: fix_notifications_table.sql" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error creating table: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please run the SQL script manually in MySQL Workbench:" -ForegroundColor Yellow
    Write-Host "File: fix_notifications_table.sql" -ForegroundColor Yellow
}

Write-Host "`nPress any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
