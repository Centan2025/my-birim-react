Option Explicit

Public Sub BirimKlasorleriOlustur()
    Dim wb As Workbook
    Dim fDialog As FileDialog
    Dim rootPath As String
    Dim paths As Object ' Scripting.Dictionary
    Dim key As Variant
    
    On Error GoTo ErrHandler
    
    Set wb = ThisWorkbook
    
    ' Ana klasörü seçtir – başlangıç klasörü Excel dosyasının olduğu yer
    Set fDialog = Application.FileDialog(msoFileDialogFolderPicker)
    Dim startFolder As String
    startFolder = ThisWorkbook.Path
    If startFolder <> "" Then
        fDialog.InitialFileName = startFolder & "\"
    End If
    
    With fDialog
        .Title = "Klasörlerin oluşturulacağı ana klasörü seçin"
        If .Show <> -1 Then
            MsgBox "Herhangi bir klasör seçilmedi.", vbExclamation
            Exit Sub
        End If
        rootPath = .SelectedItems(1)
    End With
    
    If Right(rootPath, 1) <> "\" Then
        rootPath = rootPath & "\"
    End If
    
    ' Klasör listesi için Dictionary
    Set paths = CreateObject("Scripting.Dictionary")
    
    ' 1) MALZEMELER sayfası › MALZEMELER/GRUP/KARTELA
    Call Topla_Malzemeler(wb, paths)
    
    ' 2) TASARIMCILAR sayfası › TASARIMCILAR/TASARIMCI/(Alt Klasörler)
    Call Topla_Tasarimcilar(wb, paths)
    
    ' 3) PROJELER sayfası › PROJELER/PROJE/(Alt Klasörler)
    Call Topla_Projeler(wb, paths)
    
    ' 4) ÜRÜNLER sayfası › ÜRÜNLER/KATEGORİ/ÜRÜN/(Alt Klasörler)
    Call Topla_Urunler(wb, paths)
    
    If paths.Count = 0 Then
        MsgBox "Excel'den klasör yapısı çıkarılamadı (hiç klasör yolu bulunamadı).", vbInformation
        Exit Sub
    End If
    
    ' Klasörleri oluştur
    Dim createdCount As Long
    createdCount = 0
    
    For Each key In paths.Keys
        Dim relPath As String
        Dim fullPath As String
        
        relPath = CStr(key)
        ' Sondaki / veya \ işaretlerini temizle
        Do While Right(relPath, 1) = "/" Or Right(relPath, 1) = "\"
            relPath = Left(relPath, Len(relPath) - 1)
        Loop
        
        If relPath <> "" Then
            fullPath = rootPath & Replace(relPath, "/", "\")
            Call EnsureFolders(fullPath)
            createdCount = createdCount + 1
        End If
    Next key
    
    MsgBox "Klasörler oluşturuldu." & vbCrLf & _
           "Toplam klasör yolu: " & paths.Count & vbCrLf & _
           "İşlenen klasör: " & createdCount, vbInformation

    Exit Sub

ErrHandler:
    MsgBox "Hata oluştu: " & Err.Description, vbCritical
End Sub

'----------------------------------------------------------
' Tek tek tüm ara klasörleri oluştur
'----------------------------------------------------------
Private Sub EnsureFolders(ByVal fullPath As String)
    Dim parts() As String
    Dim i As Long
    Dim currentPath As String
    
    parts = Split(fullPath, "\")
    currentPath = parts(0)
    
    For i = 1 To UBound(parts)
        currentPath = currentPath & "\" & parts(i)
        If Dir(currentPath, vbDirectory) = vbNullString Then
            On Error Resume Next
            MkDir currentPath
            On Error GoTo 0
        End If
    Next i
End Sub

'----------------------------------------------------------
' MALZEMELER sayfası
' A: LİSTEYE EKLE › "SON" dur, "-" atla
' B: MALZEME GRUBU
' C: KARTELA
'----------------------------------------------------------
Private Sub Topla_Malzemeler(ByVal wb As Workbook, ByVal paths As Object)
    Dim sh As Worksheet
    Dim ws As Worksheet
    Dim found As Boolean
    Dim lastRow As Long, i As Long
    Dim colA As String, groupName As String, bookName As String
    
    found = False
    For Each ws In wb.Sheets
        If InStr(1, UCase(ws.Name), "MALZEMELER", vbTextCompare) > 0 Then
            Set sh = ws
            found = True
            Exit For
        End If
    Next ws
    
    If Not found Then Exit Sub
    
    lastRow = sh.Cells(sh.Rows.Count, "A").End(xlUp).Row
    For i = 3 To lastRow
        colA = Trim(CStr(sh.Cells(i, "A").Value))
        If UCase(colA) = "SON" Then Exit For
        If colA = "-" Then GoTo DevamEt
        
        groupName = Trim(CStr(sh.Cells(i, "B").Value))
        bookName = Trim(CStr(sh.Cells(i, "C").Value))
        If groupName <> "" And bookName <> "" Then
            Call AddPathIfNotExists(paths, "MALZEMELER/" & groupName & "/" & bookName & "/")
        End If
DevamEt:
    Next i
End Sub

'----------------------------------------------------------
' TASARIMCILAR sayfası
' A: LİSTEYE EKLE › "SON" dur, "-" atla
' C: TASARIMCI ADI
'----------------------------------------------------------
Private Sub Topla_Tasarimcilar(ByVal wb As Workbook, ByVal paths As Object)
    Dim sh As Worksheet
    Dim ws As Worksheet
    Dim found As Boolean
    Dim lastRow As Long, i As Long
    Dim colA As String, designerName As String
    Dim basePath As String
    
    found = False
    For Each ws In wb.Sheets
        If InStr(1, UCase(ws.Name), "TASARIMCILAR", vbTextCompare) > 0 Or _
           InStr(1, UCase(ws.Name), "DESIGNER", vbTextCompare) > 0 Then
            Set sh = ws
            found = True
            Exit For
        End If
    Next ws
    
    If Not found Then Exit Sub
    
    lastRow = sh.Cells(sh.Rows.Count, "A").End(xlUp).Row
    For i = 3 To lastRow
        colA = Trim(CStr(sh.Cells(i, "A").Value))
        If UCase(colA) = "SON" Then Exit For
        If colA = "-" Then GoTo DevamEt
        
        designerName = Trim(CStr(sh.Cells(i, "C").Value))
        If designerName <> "" Then
            basePath = "TASARIMCILAR/" & designerName & "/"
            Call AddPathIfNotExists(paths, basePath & "TÜM CİHAZLAR/")
            Call AddPathIfNotExists(paths, basePath & "DESKTOP/")
            Call AddPathIfNotExists(paths, basePath & "MOBİL/")
        End If
DevamEt:
    Next i
End Sub

'----------------------------------------------------------
' PROJELER sayfası
' A: LİSTEYE EKLE › "SON" dur, "-" atla
' C: PROJE ADI
'----------------------------------------------------------
Private Sub Topla_Projeler(ByVal wb As Workbook, ByVal paths As Object)
    Dim sh As Worksheet
    Dim ws As Worksheet
    Dim found As Boolean
    Dim lastRow As Long, i As Long
    Dim colA As String, projectName As String
    Dim basePath As String
    
    found = False
    For Each ws In wb.Sheets
        If InStr(1, UCase(ws.Name), "PROJELER", vbTextCompare) > 0 Or _
           InStr(1, UCase(ws.Name), "PROJECT", vbTextCompare) > 0 Then
            Set sh = ws
            found = True
            Exit For
        End If
    Next ws
    
    If Not found Then Exit Sub
    
    lastRow = sh.Cells(sh.Rows.Count, "A").End(xlUp).Row
    For i = 2 To lastRow
        colA = Trim(CStr(sh.Cells(i, "A").Value))
        If UCase(colA) = "SON" Then Exit For
        If colA = "-" Then GoTo DevamEt
        
        projectName = Trim(CStr(sh.Cells(i, "C").Value))
        If projectName <> "" Then
            basePath = "PROJELER/" & projectName & "/"
            
            ' Kapak Görseli
            Call AddPathIfNotExists(paths, basePath & "KAPAK GÖRSELİ/TÜM CİHAZLAR/")
            Call AddPathIfNotExists(paths, basePath & "KAPAK GÖRSELİ/DESKTOP/")
            Call AddPathIfNotExists(paths, basePath & "KAPAK GÖRSELİ/MOBİL/")
            
            ' İçerik Blokları (Blok 1-5 placeholder)
            Dim b As Integer
            For b = 1 To 5
                Call AddPathIfNotExists(paths, basePath & "İÇERİK BLOKLARI/BLOK " & b & "/TÜM CİHAZLAR/")
                Call AddPathIfNotExists(paths, basePath & "İÇERİK BLOKLARI/BLOK " & b & "/DESKTOP/")
                Call AddPathIfNotExists(paths, basePath & "İÇERİK BLOKLARI/BLOK " & b & "/MOBİL/")
            Next b
        End If
DevamEt:
    Next i
End Sub

'----------------------------------------------------------
' ÜRÜNLER sayfası
' A: LİSTEYE EKLE › "SON" dur, "-" atla
' B: ÜRÜN GRUBU (Kategori)
' D: AD (Ürün adı)
'----------------------------------------------------------
Private Sub Topla_Urunler(ByVal wb As Workbook, ByVal paths As Object)
    Dim sh As Worksheet
    Dim ws As Worksheet
    Dim found As Boolean
    Dim lastRow As Long, i As Long
    Dim colA As String, categoryName As String, productName As String
    Dim basePath As String
    
    found = False
    For Each ws In wb.Sheets
        If InStr(1, UCase(ws.Name), "ÜRÜNLER", vbTextCompare) > 0 Or _
           InStr(1, UCase(ws.Name), "URUNLER", vbTextCompare) > 0 Or _
           InStr(1, UCase(ws.Name), "PRODUCT", vbTextCompare) > 0 Then
            Set sh = ws
            found = True
            Exit For
        End If
    Next ws
    
    If Not found Then Exit Sub
    
    lastRow = sh.Cells(sh.Rows.Count, "A").End(xlUp).Row
    For i = 3 To lastRow
        colA = Trim(CStr(sh.Cells(i, "A").Value))
        If UCase(colA) = "SON" Then Exit For
        If colA = "-" Then GoTo DevamEt
        
        categoryName = Trim(CStr(sh.Cells(i, "B").Value))
        productName = Trim(CStr(sh.Cells(i, "D").Value))
        If categoryName <> "" And productName <> "" Then
            basePath = "ÜRÜNLER/" & categoryName & "/" & productName & "/"
            
            ' Ana Ürün Klasörü ve Altları
            Call AddPathIfNotExists(paths, basePath)
            
            ' ANA GÖRSEL
            Call AddPathIfNotExists(paths, basePath & "ANA GÖRSEL/TÜM CİHAZLAR/")
            Call AddPathIfNotExists(paths, basePath & "ANA GÖRSEL/DESKTOP/")
            Call AddPathIfNotExists(paths, basePath & "ANA GÖRSEL/MOBİL/")
            
            ' ALTERNATİF MEDYA
            Call AddPathIfNotExists(paths, basePath & "ALTERNATİF MEDYA/TÜM CİHAZLAR/")
            Call AddPathIfNotExists(paths, basePath & "ALTERNATİF MEDYA/DESKTOP/")
            Call AddPathIfNotExists(paths, basePath & "ALTERNATİF MEDYA/MOBİL/")
            
            ' İNDİRİLEBİLİR DOSYALAR
            Call AddPathIfNotExists(paths, basePath & "İndirilebilir Dosyalar/3D DOSYALAR/")
            Call AddPathIfNotExists(paths, basePath & "İndirilebilir Dosyalar/EK GÖRSELLER/")
            Call AddPathIfNotExists(paths, basePath & "İndirilebilir Dosyalar/TEKNİK ÇİZİMLER/")
            
            ' ÖLÇÜLER
            Call AddPathIfNotExists(paths, basePath & "ÖLÇÜLER/")
        End If
DevamEt:
    Next i
End Sub

'----------------------------------------------------------
' Dictionary'e yolu ekle (varsa ekleme)
'----------------------------------------------------------
Private Sub AddPathIfNotExists(ByVal paths As Object, ByVal relPath As String)
    Dim key As String
    key = relPath
    If Not paths.Exists(key) Then
        paths.Add key, True
    End If
End Sub
