; OptiAI NSIS Installer Script
; AI-Powered System Optimizer

;--------------------------------
; General

; The name of the installer
Name "OptiAI"

; The file to write
OutFile "OptiAI_Setup.exe"

; The default installation directory
InstallDir "$PROGRAMFILES\OptiAI"

; Registry key to check for directory (so if you install again, it will 
; overwrite the old one automatically)
InstallDirRegKey HKLM "Software\OptiAI" "Install_Dir"

; Request application privileges for Windows Vista/7/8/10/11
RequestExecutionLevel admin

;--------------------------------
; Version Information

VIProductVersion "1.0.0.0"
VIAddVersionKey "ProductName" "OptiAI"
VIAddVersionKey "CompanyName" "OptiAI Team"
VIAddVersionKey "LegalCopyright" "© 2024 OptiAI. All rights reserved."
VIAddVersionKey "FileDescription" "OptiAI - AI-Powered System Optimizer"
VIAddVersionKey "FileVersion" "1.0.0.0"
VIAddVersionKey "ProductVersion" "1.0.0.0"
VIAddVersionKey "InternalName" "OptiAI"
VIAddVersionKey "LegalTrademarks" ""
VIAddVersionKey "OriginalFilename" "OptiAI_Setup.exe"

;--------------------------------
; Interface Settings

!define MUI_ABORTWARNING
!define MUI_ICON "icons\icon.ico"
!define MUI_UNICON "icons\icon.ico"

; Include the Modern UI
!include "MUI2.nsh"

;--------------------------------
; Pages

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "license.txt"
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

;--------------------------------
; Languages

!insertmacro MUI_LANGUAGE "English"

;--------------------------------
; Installer Sections

Section "OptiAI Core" SecCore

  SectionIn RO
  
  ; Set output path to the installation directory.
  SetOutPath $INSTDIR
  
  ; Put file there
  File "OptiAI.exe"
  File "backend-server.exe"
  File "llama-server.exe"
  File "config.json"
  File "policy.yaml"
  File "README.txt"
  File "LICENSE.txt"
  File "CHANGELOG.txt"
  
  ; Create directories
  CreateDirectory "$INSTDIR\Resources"
  CreateDirectory "$INSTDIR\Models"
  CreateDirectory "$INSTDIR\Logs"
  CreateDirectory "$INSTDIR\Config"
  
  ; Copy model files
  SetOutPath "$INSTDIR\Models"
  File "phi-2-q4_k_m.gguf"
  File "model-config.json"
  
  ; Copy resources
  SetOutPath "$INSTDIR\Resources"
  File "icons\*.*"
  
  ; Write the installation path into the registry
  WriteRegStr HKLM SOFTWARE\OptiAI "Install_Dir" "$INSTDIR"
  
  ; Write the uninstall keys for Windows
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\OptiAI" "DisplayName" "OptiAI"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\OptiAI" "UninstallString" '"$INSTDIR\uninstall.exe"'
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\OptiAI" "DisplayIcon" '"$INSTDIR\OptiAI.exe"'
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\OptiAI" "DisplayVersion" "1.0.0"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\OptiAI" "Publisher" "OptiAI Team"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\OptiAI" "HelpLink" "https://github.com/yourusername/optiai"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\OptiAI" "URLInfoAbout" "https://github.com/yourusername/optiai"
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\OptiAI" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\OptiAI" "NoRepair" 1
  
  ; Calculate the size
  Call GetInstalledSize
  Pop $0
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\OptiAI" "EstimatedSize" "$0"
  
  ; Create the uninstaller
  WriteUninstaller "uninstall.exe"

SectionEnd

; Optional section (can be disabled by the user)
Section "Start Menu Shortcuts" SecStartMenu

  CreateDirectory "$SMPROGRAMS\OptiAI"
  CreateShortCut "$SMPROGRAMS\OptiAI\OptiAI.lnk" "$INSTDIR\OptiAI.exe" "" "$INSTDIR\OptiAI.exe" 0
  CreateShortCut "$SMPROGRAMS\OptiAI\Uninstall.lnk" "$INSTDIR\uninstall.exe" "" "$INSTDIR\uninstall.exe" 0

SectionEnd

; Optional section (can be disabled by the user)
Section "Desktop Shortcut" SecDesktop

  CreateShortCut "$DESKTOP\OptiAI.lnk" "$INSTDIR\OptiAI.exe" "" "$INSTDIR\OptiAI.exe" 0

SectionEnd

; Optional section (can be disabled by the user)
Section "File Associations" SecFileAssoc

  ; Associate .optiai files with OptiAI
  WriteRegStr HKCR ".optiai" "" "OptiAIFile"
  WriteRegStr HKCR "OptiAIFile" "" "OptiAI Project File"
  WriteRegStr HKCR "OptiAIFile\DefaultIcon" "" "$INSTDIR\OptiAI.exe,0"
  WriteRegStr HKCR "OptiAIFile\shell\open\command" "" '"$INSTDIR\OptiAI.exe" "%1"'

SectionEnd

; Optional section (can be disabled by the user)
Section "Windows Firewall Exception" SecFirewall

  ; Add Windows Firewall exception
  ExecWait 'netsh advfirewall firewall add rule name="OptiAI" dir=in action=allow program="$INSTDIR\OptiAI.exe" enable=yes'
  ExecWait 'netsh advfirewall firewall add rule name="OptiAI Backend" dir=in action=allow program="$INSTDIR\backend-server.exe" enable=yes'
  ExecWait 'netsh advfirewall firewall add rule name="OptiAI LLM Server" dir=in action=allow program="$INSTDIR\llama-server.exe" enable=yes'

SectionEnd

; Optional section (can be disabled by the user)
Section "Windows Defender Exclusion" SecDefender

  ; Add Windows Defender exclusion
  ExecWait 'powershell -Command "Add-MpPreference -ExclusionPath \"$INSTDIR\""'

SectionEnd

; Optional section (can be disabled by the user)
Section "Auto-Start Service" SecService

  ; Create a service entry (if needed)
  WriteRegStr HKLM "SYSTEM\CurrentControlSet\Services\OptiAI" "DisplayName" "OptiAI Background Service"
  WriteRegStr HKLM "SYSTEM\CurrentControlSet\Services\OptiAI" "Description" "OptiAI background optimization service"
  WriteRegStr HKLM "SYSTEM\CurrentControlSet\Services\OptiAI" "ImagePath" "$INSTDIR\OptiAI.exe --service"
  WriteRegDWORD HKLM "SYSTEM\CurrentControlSet\Services\OptiAI" "Start" 2
  WriteRegDWORD HKLM "SYSTEM\CurrentControlSet\Services\OptiAI" "Type" 16

SectionEnd

;--------------------------------
; Descriptions

; Language strings
LangString DESC_SecCore ${LANG_ENGLISH} "Core OptiAI application files (required)"
LangString DESC_SecStartMenu ${LANG_ENGLISH} "Create Start Menu shortcuts"
LangString DESC_SecDesktop ${LANG_ENGLISH} "Create Desktop shortcut"
LangString DESC_SecFileAssoc ${LANG_ENGLISH} "Associate .optiai files with OptiAI"
LangString DESC_SecFirewall ${LANG_ENGLISH} "Add Windows Firewall exceptions"
LangString DESC_SecDefender ${LANG_ENGLISH} "Add Windows Defender exclusion"
LangString DESC_SecService ${LANG_ENGLISH} "Install as Windows service for auto-start"

; Assign language strings to sections
!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SecCore} $(DESC_SecCore)
  !insertmacro MUI_DESCRIPTION_TEXT ${SecStartMenu} $(DESC_SecStartMenu)
  !insertmacro MUI_DESCRIPTION_TEXT ${SecDesktop} $(DESC_SecDesktop)
  !insertmacro MUI_DESCRIPTION_TEXT ${SecFileAssoc} $(DESC_SecFileAssoc)
  !insertmacro MUI_DESCRIPTION_TEXT ${SecFirewall} $(DESC_SecFirewall)
  !insertmacro MUI_DESCRIPTION_TEXT ${SecDefender} $(DESC_SecDefender)
  !insertmacro MUI_DESCRIPTION_TEXT ${SecService} $(DESC_SecService)
!insertmacro MUI_FUNCTION_DESCRIPTION_END

;--------------------------------
; Uninstaller

Section "Uninstall"
  
  ; Remove registry keys
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\OptiAI"
  DeleteRegKey HKLM SOFTWARE\OptiAI
  
  ; Remove file associations
  DeleteRegKey HKCR ".optiai"
  DeleteRegKey HKCR "OptiAIFile"
  
  ; Remove Windows Firewall exceptions
  ExecWait 'netsh advfirewall firewall delete rule name="OptiAI"'
  ExecWait 'netsh advfirewall firewall delete rule name="OptiAI Backend"'
  ExecWait 'netsh advfirewall firewall delete rule name="OptiAI LLM Server"'
  
  ; Remove Windows Defender exclusion
  ExecWait 'powershell -Command "Remove-MpPreference -ExclusionPath \"$INSTDIR\""'
  
  ; Remove service
  DeleteRegKey HKLM "SYSTEM\CurrentControlSet\Services\OptiAI"
  
  ; Remove files and uninstaller
  Delete $INSTDIR\OptiAI.exe
  Delete $INSTDIR\backend-server.exe
  Delete $INSTDIR\llama-server.exe
  Delete $INSTDIR\config.json
  Delete $INSTDIR\policy.yaml
  Delete $INSTDIR\README.txt
  Delete $INSTDIR\LICENSE.txt
  Delete $INSTDIR\CHANGELOG.txt
  Delete $INSTDIR\uninstall.exe
  
  ; Remove directories
  RMDir /r "$INSTDIR\Models"
  RMDir /r "$INSTDIR\Resources"
  RMDir /r "$INSTDIR\Logs"
  RMDir /r "$INSTDIR\Config"
  RMDir "$INSTDIR"
  
  ; Remove shortcuts, if any
  Delete "$SMPROGRAMS\OptiAI\*.*"
  RMDir "$SMPROGRAMS\OptiAI"
  Delete "$DESKTOP\OptiAI.lnk"

SectionEnd

;--------------------------------
; Functions

Function GetInstalledSize
  Push $0
  Push $1
  StrCpy $0 0
  ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $1
  IntFmt $0 "0x%08X" $0
  Pop $1
  Exch $0
FunctionEnd

;--------------------------------
; Installer Attributes

; The text to prompt the user to enter a directory
DirText "Choose a folder in which to install OptiAI."

; The default installation directory
InstallDir "$PROGRAMFILES\OptiAI"

; Registry key to check for directory (so if you install again, it will 
; overwrite the old one automatically)
InstallDirRegKey HKLM "Software\OptiAI" "Install_Dir"

; The text to prompt the user to enter a directory
DirText "This will install OptiAI on your computer. Choose a directory"

;--------------------------------
; Version Information

VIProductVersion "1.0.0.0"
VIAddVersionKey "ProductName" "OptiAI"
VIAddVersionKey "CompanyName" "OptiAI Team"
VIAddVersionKey "LegalCopyright" "© 2024 OptiAI. All rights reserved."
VIAddVersionKey "FileDescription" "OptiAI - AI-Powered System Optimizer"
VIAddVersionKey "FileVersion" "1.0.0.0"
VIAddVersionKey "ProductVersion" "1.0.0.0"
VIAddVersionKey "InternalName" "OptiAI"
VIAddVersionKey "LegalTrademarks" ""
VIAddVersionKey "OriginalFilename" "OptiAI_Setup.exe"

;--------------------------------
; Modern UI Configuration

!define MUI_ABORTWARNING
!define MUI_ICON "icons\icon.ico"
!define MUI_UNICON "icons\icon.ico"

; Header image
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "header.bmp"
!define MUI_HEADERIMAGE_UNBITMAP "header.bmp"

; Welcome image
!define MUI_WELCOMEFINISHPAGE_BITMAP "welcome.bmp"
!define MUI_UNWELCOMEFINISHPAGE_BITMAP "welcome.bmp"

;--------------------------------
; Installer Finish Page

!define MUI_FINISHPAGE_RUN "$INSTDIR\OptiAI.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Launch OptiAI"
!define MUI_FINISHPAGE_LINK "Visit the OptiAI website for the latest news, FAQs and support"
!define MUI_FINISHPAGE_LINK_LOCATION "https://github.com/yourusername/optiai"

;--------------------------------
; Uninstaller Finish Page

!define MUI_UNFINISHPAGE_NOAUTOCLOSE

;--------------------------------
; Installer Sections

Section "OptiAI Core" SecCore

  SectionIn RO
  
  ; Set output path to the installation directory.
  SetOutPath $INSTDIR
  
  ; Put file there
  File "OptiAI.exe"
  File "backend-server.exe"
  File "llama-server.exe"
  File "config.json"
  File "policy.yaml"
  File "README.txt"
  File "LICENSE.txt"
  File "CHANGELOG.txt"
  
  ; Create directories
  CreateDirectory "$INSTDIR\Resources"
  CreateDirectory "$INSTDIR\Models"
  CreateDirectory "$INSTDIR\Logs"
  CreateDirectory "$INSTDIR\Config"
  
  ; Copy model files
  SetOutPath "$INSTDIR\Models"
  File "phi-2-q4_k_m.gguf"
  File "model-config.json"
  
  ; Copy resources
  SetOutPath "$INSTDIR\Resources"
  File "icons\*.*"
  
  ; Write the installation path into the registry
  WriteRegStr HKLM SOFTWARE\OptiAI "Install_Dir" "$INSTDIR"
  
  ; Write the uninstall keys for Windows
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\OptiAI" "DisplayName" "OptiAI"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\OptiAI" "UninstallString" '"$INSTDIR\uninstall.exe"'
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\OptiAI" "DisplayIcon" '"$INSTDIR\OptiAI.exe"'
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\OptiAI" "DisplayVersion" "1.0.0"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\OptiAI" "Publisher" "OptiAI Team"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\OptiAI" "HelpLink" "https://github.com/yourusername/optiai"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\OptiAI" "URLInfoAbout" "https://github.com/yourusername/optiai"
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\OptiAI" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\OptiAI" "NoRepair" 1
  
  ; Calculate the size
  Call GetInstalledSize
  Pop $0
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\OptiAI" "EstimatedSize" "$0"
  
  ; Create the uninstaller
  WriteUninstaller "uninstall.exe"

SectionEnd
