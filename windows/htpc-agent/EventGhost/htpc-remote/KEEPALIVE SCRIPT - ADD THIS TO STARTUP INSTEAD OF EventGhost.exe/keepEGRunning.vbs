Dim objWMIService, objItems, objShell
Set objShell = WScript.CreateObject("WScript.Shell") 
Set objWMIService = GetObject("winmgmts:" + "{impersonationLevel=impersonate}!\\" + ".\root\cimv2")
  do 
    sQuery = "SELECT * FROM Win32_Process WHERE Name = ""EventGhost.exe""" 
    Set objItems = objWMIService.ExecQuery(sQuery) 

    If objItems.Count = 0 Then 
      On Error Resume Next 
        objShell.Run """" & objShell.ExpandEnvironmentStrings("%PROGRAMFILES(x86)%") & "\EventGhost\EventGhost.exe" & """", 7, False 
	  objShell.Run """" & objShell.ExpandEnvironmentStrings("%PROGRAMFILES%") & "\EventGhost\EventGhost.exe" & """", 7, False


    On Error GoTo 0

  End If
  wscript.sleep 5000
loop