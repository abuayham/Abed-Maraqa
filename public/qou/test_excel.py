import os
import win32com.client as win32

def test_excel():
    try:
        excel = win32.gencache.EnsureDispatch('Excel.Application')
        excel.Visible = False
        wb = excel.Workbooks.Add()
        ws = wb.ActiveSheet
        ws.Cells(1, 1).Value = "Test"
        wb.SaveAs(os.path.abspath("test_excel.xlsx"))
        wb.Close()
        excel.Quit()
        print("Excel COM works!")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    test_excel()
