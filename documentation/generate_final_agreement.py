import re
import os
import docx
from docx.shared import Inches, Pt, RGBColor, Mm
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_COLOR_INDEX
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

NAVY = RGBColor(15, 37, 87)       # #0F2557 - Deep Navy
SLATE_NAVY = RGBColor(30, 58, 138)# #1E3A8A - Secondary Heading
BODY_COLOR = RGBColor(31, 41, 55) # #1F2937 - Charcoal Body
MUTED = RGBColor(100, 116, 139)   # #64748B - Slate Metadata
AMBER_BROWN = RGBColor(146, 64, 14)

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_shading(cell, color_hex):
    shading_xml = f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>'
    cell._tc.get_or_add_tcPr().append(parse_xml(shading_xml))

def set_cell_borders(cell, top=None, bottom=None, left=None, right=None):
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    borders = {'top': top, 'bottom': bottom, 'left': left, 'right': right}
    for b_name, b_val in borders.items():
        if b_val:
            border_el = OxmlElement(f'w:{b_name}')
            border_el.set(qn('w:val'), b_val.get('val', 'single'))
            border_el.set(qn('w:sz'), str(b_val.get('sz', 4)))
            border_el.set(qn('w:space'), '0')
            border_el.set(qn('w:color'), b_val.get('color', 'CBD5E1'))
            tcBorders.append(border_el)
        else:
            border_el = OxmlElement(f'w:{b_name}')
            border_el.set(qn('w:val'), 'none')
            tcBorders.append(border_el)
    tcPr.append(tcBorders)

def make_row_cant_split(row):
    trPr = row._tr.get_or_add_trPr()
    trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))

def make_header_row(row):
    trPr = row._tr.get_or_add_trPr()
    trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))
    trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))

def add_formatted_runs(p, text, default_size=10.5, default_color=BODY_COLOR, bold_color=NAVY):
    pattern = r'(\*\*\[[^\]]+\]\*\*|\[[^\]]+\]|\*\*[^*]+\*\*|[^*\[]+)'
    tokens = re.findall(pattern, text)
    
    for token in tokens:
        if not token:
            continue
        
        # Bold placeholder: **[...]**
        if token.startswith('**[') and token.endswith(']**'):
            inner = token[2:-2]
            run = p.add_run(inner)
            run.font.name = "Calibri"
            run.font.size = Pt(default_size)
            run.bold = True
            run.font.color.rgb = AMBER_BROWN
            run.font.highlight_color = WD_COLOR_INDEX.YELLOW
            
        # Regular placeholder: [...]
        elif token.startswith('[') and token.endswith(']'):
            run = p.add_run(token)
            run.font.name = "Calibri"
            run.font.size = Pt(default_size)
            run.bold = True
            run.font.color.rgb = AMBER_BROWN
            run.font.highlight_color = WD_COLOR_INDEX.YELLOW
            
        # Bold text: **...**
        elif token.startswith('**') and token.endswith('**'):
            inner = token[2:-2]
            run = p.add_run(inner)
            run.font.name = "Calibri"
            run.font.size = Pt(default_size)
            run.bold = True
            run.font.color.rgb = bold_color
            
        else:
            run = p.add_run(token)
            run.font.name = "Calibri"
            run.font.size = Pt(default_size)
            run.font.color.rgb = default_color

def init_doc():
    doc = docx.Document()
    for section in doc.sections:
        section.page_width = Mm(210)
        section.page_height = Mm(297)
        section.top_margin = Mm(24)
        section.bottom_margin = Mm(24)
        section.left_margin = Mm(24)
        section.right_margin = Mm(24)
        section.different_first_page_header_footer = True
        
        # Header (Pages 2+)
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hp.paragraph_format.space_after = Pt(4)
        hrun = hp.add_run("SweafEx–Octagram Software Development and Implementation Agreement")
        hrun.font.name = "Calibri"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = MUTED
        
        pPr = hp._p.get_or_add_pPr()
        pBdr = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="4" w:space="4" w:color="CBD5E1"/></w:pBdr>')
        pPr.append(pBdr)
        
        # Footer (Pages 2+)
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.paragraph_format.space_before = Pt(4)
        
        frun1 = fp.add_run("SweafEx Digital Operations Platform — Phase 1")
        frun1.font.name = "Calibri"
        frun1.font.size = Pt(8.5)
        frun1.font.color.rgb = MUTED
        
        frun2 = fp.add_run("\t\tPage ")
        frun2.font.name = "Calibri"
        frun2.font.size = Pt(8.5)
        frun2.font.color.rgb = MUTED
        
        run_page = fp.add_run()
        run_page.font.name = "Calibri"
        run_page.font.size = Pt(8.5)
        run_page.font.color.rgb = MUTED
        fld1 = parse_xml(r'<w:fldChar %s w:fldCharType="begin"/>' % nsdecls('w'))
        instr1 = parse_xml(r'<w:instrText %s xml:space="preserve"> PAGE </w:instrText>' % nsdecls('w'))
        fld2 = parse_xml(r'<w:fldChar %s w:fldCharType="separate"/>' % nsdecls('w'))
        fld3 = parse_xml(r'<w:fldChar %s w:fldCharType="end"/>' % nsdecls('w'))
        run_page._r.extend([fld1, instr1, fld2, fld3])
        
        frun3 = fp.add_run(" of ")
        frun3.font.name = "Calibri"
        frun3.font.size = Pt(8.5)
        frun3.font.color.rgb = MUTED
        
        run_numpages = fp.add_run()
        run_numpages.font.name = "Calibri"
        run_numpages.font.size = Pt(8.5)
        run_numpages.font.color.rgb = MUTED
        fld4 = parse_xml(r'<w:fldChar %s w:fldCharType="begin"/>' % nsdecls('w'))
        instr2 = parse_xml(r'<w:instrText %s xml:space="preserve"> NUMPAGES </w:instrText>' % nsdecls('w'))
        fld5 = parse_xml(r'<w:fldChar %s w:fldCharType="separate"/>' % nsdecls('w'))
        fld6 = parse_xml(r'<w:fldChar %s w:fldCharType="end"/>' % nsdecls('w'))
        run_numpages._r.extend([fld4, instr2, fld5, fld6])
        
        fpPr = fp._p.get_or_add_pPr()
        fpBdr = parse_xml(f'<w:pBdr {nsdecls("w")}><w:top w:val="single" w:sz="4" w:space="4" w:color="CBD5E1"/></w:pBdr>')
        fpPr.append(fpBdr)
        
    return doc

def add_title_block(doc, title_text, subtitle_text, lead_text):
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(3)
    run_title = p_title.add_run(title_text)
    run_title.font.name = "Calibri"
    run_title.font.size = Pt(21)
    run_title.bold = True
    run_title.font.color.rgb = NAVY
    
    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(10)
    run_sub = p_sub.add_run(subtitle_text)
    run_sub.font.name = "Calibri"
    run_sub.font.size = Pt(12)
    run_sub.bold = True
    run_sub.font.color.rgb = SLATE_NAVY
    
    pPr = p_sub._p.get_or_add_pPr()
    pBdr = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="12" w:space="8" w:color="0F2557"/></w:pBdr>')
    pPr.append(pBdr)
    
    p_lead = doc.add_paragraph()
    p_lead.paragraph_format.space_before = Pt(8)
    p_lead.paragraph_format.space_after = Pt(12)
    p_lead.paragraph_format.line_spacing = 1.15
    add_formatted_runs(p_lead, lead_text)

def add_h1(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = "Calibri"
    run.font.size = Pt(12.5)
    run.bold = True
    run.font.color.rgb = NAVY
    return p

def add_h2(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = "Calibri"
    run.font.size = Pt(11)
    run.bold = True
    run.font.color.rgb = SLATE_NAVY
    return p

def add_h3(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = "Calibri"
    run.font.size = Pt(10.5)
    run.bold = True
    run.font.color.rgb = SLATE_NAVY
    return p

def add_body_p(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.15
    add_formatted_runs(p, text)
    return p

def add_clause_p(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.left_indent = Pt(22)
    p.paragraph_format.first_line_indent = Pt(-22)
    add_formatted_runs(p, text)
    return p

def add_lettered_p(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.left_indent = Pt(38)
    p.paragraph_format.first_line_indent = Pt(-18)
    add_formatted_runs(p, text)
    return p

def add_bullet_p(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.left_indent = Pt(26)
    p.paragraph_format.first_line_indent = Pt(-14)
    clean_text = text
    if clean_text.startswith('- '):
        clean_text = '•  ' + clean_text[2:]
    add_formatted_runs(p, clean_text)
    return p

def add_commercial_table(doc):
    # Clause 4.2 Table: 5 columns
    headers = [
        "Payment Stage",
        "Milestone / Scope Description",
        "Percentage",
        "Amount (INR)",
        "Payment Condition / Invoicing Trigger"
    ]
    
    rows_data = [
        ("Advance", "Project initiation, architecture setup and mobilisation", "20%", "₹60,000", "Payable against invoice; cleared funds required before project commencement & team mobilisation"),
        ("Milestone 1", "Foundation and CRM", "16%", "₹48,000", "Payable within 5 Business Days of acceptance; cleared payment required before Milestone 2 begins"),
        ("Milestone 2", "Operations and trips", "16%", "₹48,000", "Payable within 5 Business Days of acceptance; cleared payment required before Milestone 3 begins"),
        ("Milestone 3", "Automation and APIs", "16%", "₹48,000", "Payable within 5 Business Days of acceptance; cleared payment required before Milestone 4 begins"),
        ("Milestone 4", "POD lifecycle, accounts and management reporting", "16%", "₹48,000", "Payable within 5 Business Days of acceptance; cleared payment required before Milestone 5 begins"),
        ("Milestone 5", "Connected portals, agreed integrations, testing, training and deployment preparation", "16%", "₹48,000", "Payable within 5 Business Days of acceptance; cleared payment required before Production Go-Live and final handover"),
        ("Total Fee", "Fixed Phase 1 development scope as defined in Schedule 1", "100%", "₹3,00,000", "Exclusive of applicable GST and independent third-party service charges")
    ]
    
    col_widths = [Inches(1.05), Inches(1.95), Inches(0.70), Inches(0.95), Inches(2.15)]
    
    table = doc.add_table(rows=len(rows_data) + 1, cols=5)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    # Header row
    hdr_row = table.rows[0]
    make_header_row(hdr_row)
    for col_idx, text in enumerate(headers):
        cell = hdr_row.cells[col_idx]
        cell.width = col_widths[col_idx]
        set_cell_margins(cell, top=120, bottom=120, left=120, right=120)
        set_cell_shading(cell, "F1F5F9")
        set_cell_borders(cell, 
                         top={'val': 'single', 'sz': 6, 'color': '94A3B8'},
                         bottom={'val': 'single', 'sz': 8, 'color': '0F2557'},
                         left=None, right=None)
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.1
        if col_idx in [2, 3]:
            p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        else:
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        run = p.add_run(text)
        run.font.name = "Calibri"
        run.font.size = Pt(9.5)
        run.bold = True
        run.font.color.rgb = NAVY
        
    # Data rows
    for r_idx, row_data in enumerate(rows_data):
        row = table.rows[r_idx + 1]
        make_row_cant_split(row)
        is_total = (r_idx == len(rows_data) - 1)
        bg_color = "F8FAFC" if (is_total or r_idx % 2 == 1) else "FFFFFF"
        
        for c_idx, val in enumerate(row_data):
            cell = row.cells[c_idx]
            cell.width = col_widths[c_idx]
            set_cell_margins(cell, top=90, bottom=90, left=120, right=120)
            set_cell_shading(cell, bg_color)
            
            if is_total:
                set_cell_borders(cell, 
                                 top={'val': 'single', 'sz': 6, 'color': '0F2557'},
                                 bottom={'val': 'double', 'sz': 8, 'color': '0F2557'},
                                 left=None, right=None)
            else:
                set_cell_borders(cell, 
                                 top=None,
                                 bottom={'val': 'single', 'sz': 4, 'color': 'E2E8F0'},
                                 left=None, right=None)
                
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.15
            if c_idx in [2, 3]:
                p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                
            run = p.add_run(val)
            run.font.name = "Calibri"
            run.font.size = Pt(9.5)
            if is_total or c_idx == 0:
                run.bold = True
                run.font.color.rgb = NAVY
            elif c_idx == 3:
                run.bold = True
                run.font.color.rgb = SLATE_NAVY
            else:
                run.font.color.rgb = BODY_COLOR
                
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def add_schedule2_table(doc):
    headers = [
        "Development Stage",
        "Target Period",
        "Required Deliverable & Acceptance Scope",
        "Milestone Fee (INR)"
    ]
    
    rows_data = [
        ("Advance", "Before commencement", "Mobilisation and architecture initiation", "₹60,000"),
        ("Milestone 1", "Indicatively Weeks 1–2", "Foundation and CRM", "₹48,000"),
        ("Milestone 2", "Indicatively Weeks 3–4", "Operations and trips", "₹48,000"),
        ("Milestone 3", "Indicatively Weeks 5–6", "Automation and APIs", "₹48,000"),
        ("Milestone 4", "Indicatively Weeks 7–8", "POD lifecycle, accounts and management reporting", "₹48,000"),
        ("Milestone 5", "Indicatively Weeks 9–10", "Portals, agreed integrations, testing, training and deployment preparation", "₹48,000")
    ]
    
    col_widths = [Inches(1.2), Inches(1.5), Inches(3.0), Inches(1.1)]
    
    table = doc.add_table(rows=len(rows_data) + 1, cols=4)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    hdr_row = table.rows[0]
    make_header_row(hdr_row)
    for col_idx, text in enumerate(headers):
        cell = hdr_row.cells[col_idx]
        cell.width = col_widths[col_idx]
        set_cell_margins(cell, top=120, bottom=120, left=120, right=120)
        set_cell_shading(cell, "F1F5F9")
        set_cell_borders(cell, 
                         top={'val': 'single', 'sz': 6, 'color': '94A3B8'},
                         bottom={'val': 'single', 'sz': 8, 'color': '0F2557'},
                         left=None, right=None)
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.1
        if col_idx == 3:
            p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        else:
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        run = p.add_run(text)
        run.font.name = "Calibri"
        run.font.size = Pt(9.5)
        run.bold = True
        run.font.color.rgb = NAVY
        
    for r_idx, row_data in enumerate(rows_data):
        row = table.rows[r_idx + 1]
        make_row_cant_split(row)
        bg_color = "F8FAFC" if (r_idx % 2 == 1) else "FFFFFF"
        
        for c_idx, val in enumerate(row_data):
            cell = row.cells[c_idx]
            cell.width = col_widths[c_idx]
            set_cell_margins(cell, top=90, bottom=90, left=120, right=120)
            set_cell_shading(cell, bg_color)
            set_cell_borders(cell, 
                             top=None,
                             bottom={'val': 'single', 'sz': 4, 'color': 'E2E8F0'},
                             left=None, right=None)
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.15
            if c_idx == 3:
                p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                
            run = p.add_run(val)
            run.font.name = "Calibri"
            run.font.size = Pt(9.5)
            if c_idx == 0:
                run.bold = True
                run.font.color.rgb = NAVY
            elif c_idx == 3:
                run.bold = True
                run.font.color.rgb = SLATE_NAVY
            else:
                run.font.color.rgb = BODY_COLOR
                
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def add_schedule4_table(doc):
    headers = [
        "External Service / Infrastructure Category",
        "Responsibility, Account Ownership & Billing Terms to be Confirmed"
    ]
    
    rows_data = [
        ("Cloud hosting and database", "SweafEx-controlled account; provider and plan to be agreed"),
        ("Document storage and backups", "Provider, retention policy and cost to be agreed"),
        ("Domain and DNS", "Account owner and renewal responsibility to be confirmed"),
        ("WhatsApp Business API", "Provider, account ownership and usage billing to be confirmed"),
        ("RC and DL verification APIs", "Provider, credentials and per-lookup charges to be confirmed"),
        ("Email/SMS services", "Provider and usage billing to be confirmed")
    ]
    
    col_widths = [Inches(2.3), Inches(4.5)]
    
    table = doc.add_table(rows=len(rows_data) + 1, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    hdr_row = table.rows[0]
    make_header_row(hdr_row)
    for col_idx, text in enumerate(headers):
        cell = hdr_row.cells[col_idx]
        cell.width = col_widths[col_idx]
        set_cell_margins(cell, top=120, bottom=120, left=120, right=120)
        set_cell_shading(cell, "F1F5F9")
        set_cell_borders(cell, 
                         top={'val': 'single', 'sz': 6, 'color': '94A3B8'},
                         bottom={'val': 'single', 'sz': 8, 'color': '0F2557'},
                         left=None, right=None)
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.1
        run = p.add_run(text)
        run.font.name = "Calibri"
        run.font.size = Pt(9.5)
        run.bold = True
        run.font.color.rgb = NAVY
        
    for r_idx, row_data in enumerate(rows_data):
        row = table.rows[r_idx + 1]
        make_row_cant_split(row)
        bg_color = "F8FAFC" if (r_idx % 2 == 1) else "FFFFFF"
        
        for c_idx, val in enumerate(row_data):
            cell = row.cells[c_idx]
            cell.width = col_widths[c_idx]
            set_cell_margins(cell, top=90, bottom=90, left=120, right=120)
            set_cell_shading(cell, bg_color)
            set_cell_borders(cell, 
                             top=None,
                             bottom={'val': 'single', 'sz': 4, 'color': 'E2E8F0'},
                             left=None, right=None)
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.15
            run = p.add_run(val)
            run.font.name = "Calibri"
            run.font.size = Pt(9.5)
            if c_idx == 0:
                run.bold = True
                run.font.color.rgb = NAVY
            else:
                run.font.color.rgb = BODY_COLOR
                
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def add_notices_card(doc):
    # Clause 18 Notices Box (2 columns)
    table = doc.add_table(rows=1, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    col_widths = [Inches(3.35), Inches(3.45)]
    
    # Left cell: Service Provider
    c1 = table.rows[0].cells[0]
    c1.width = col_widths[0]
    set_cell_margins(c1, top=120, bottom=120, left=140, right=140)
    set_cell_shading(c1, "F8FAFC")
    set_cell_borders(c1, 
                     top={'val': 'single', 'sz': 6, 'color': '0F2557'},
                     bottom={'val': 'single', 'sz': 6, 'color': 'CBD5E1'},
                     left={'val': 'single', 'sz': 6, 'color': 'CBD5E1'},
                     right={'val': 'single', 'sz': 6, 'color': 'CBD5E1'})
    
    p1 = c1.paragraphs[0]
    p1.paragraph_format.space_after = Pt(4)
    r1 = p1.add_run("FOR THE SERVICE PROVIDER")
    r1.font.name = "Calibri"
    r1.font.size = Pt(10)
    r1.bold = True
    r1.font.color.rgb = NAVY
    
    p1_sub = c1.add_paragraph()
    p1_sub.paragraph_format.space_after = Pt(2)
    p1_sub.paragraph_format.line_spacing = 1.2
    add_formatted_runs(p1_sub, "**Name:** Umesh Shetty\n**Address:** 841, 10th cross, 26th main, Sector-1, HSR Layout, Bangalore 560102\n**Email:** [Authorised Email Address]")
    
    # Right cell: SweafEx
    c2 = table.rows[0].cells[1]
    c2.width = col_widths[1]
    set_cell_margins(c2, top=120, bottom=120, left=140, right=140)
    set_cell_shading(c2, "F8FAFC")
    set_cell_borders(c2, 
                     top={'val': 'single', 'sz': 6, 'color': '0F2557'},
                     bottom={'val': 'single', 'sz': 6, 'color': 'CBD5E1'},
                     left={'val': 'single', 'sz': 6, 'color': 'CBD5E1'},
                     right={'val': 'single', 'sz': 6, 'color': 'CBD5E1'})
    
    p2 = c2.paragraphs[0]
    p2.paragraph_format.space_after = Pt(4)
    r2 = p2.add_run("FOR SWEAFEX (CLIENT)")
    r2.font.name = "Calibri"
    r2.font.size = Pt(10)
    r2.bold = True
    r2.font.color.rgb = NAVY
    
    p2_sub = c2.add_paragraph()
    p2_sub.paragraph_format.space_after = Pt(2)
    p2_sub.paragraph_format.line_spacing = 1.2
    add_formatted_runs(p2_sub, "**Legal entity:** Sweaf Express Pvt Ltd\n**Attention:** [Authorised Representative]\n**Address:** [Registered Office Address]\n**Email:** [Authorised Email Address]")
    
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def add_schedule1_doc_id(doc):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    cell = table.rows[0].cells[0]
    cell.width = Inches(6.8)
    set_cell_margins(cell, top=120, bottom=120, left=160, right=160)
    set_cell_shading(cell, "F8FAFC")
    set_cell_borders(cell, 
                     top={'val': 'single', 'sz': 6, 'color': '0F2557'},
                     bottom={'val': 'single', 'sz': 6, 'color': 'CBD5E1'},
                     left={'val': 'single', 'sz': 6, 'color': '0F2557'},
                     right={'val': 'single', 'sz': 6, 'color': 'CBD5E1'})
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run("DOCUMENT IDENTIFICATION & SCOPE BASELINE")
    r.font.name = "Calibri"
    r.font.size = Pt(10)
    r.bold = True
    r.font.color.rgb = NAVY
    
    p_body = cell.add_paragraph()
    p_body.paragraph_format.space_after = Pt(2)
    p_body.paragraph_format.line_spacing = 1.25
    add_formatted_runs(p_body, "The Parties shall complete the following document identification before execution:\n"
                               "•  **Approved proposal filename/version:** [●]\n"
                               "•  **Approved technical specification, if any:** [●]\n"
                               "•  **Date of final scope approval:** [●]")
    
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def add_execution_block(doc):
    # Side-by-side formal signature blocks
    table = doc.add_table(rows=1, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    col_widths = [Inches(3.35), Inches(3.45)]
    
    # Left: Service Provider
    c1 = table.rows[0].cells[0]
    c1.width = col_widths[0]
    set_cell_margins(c1, top=140, bottom=140, left=140, right=140)
    set_cell_shading(c1, "FAFAFA")
    set_cell_borders(c1, 
                     top={'val': 'single', 'sz': 8, 'color': '0F2557'},
                     bottom={'val': 'single', 'sz': 6, 'color': 'CBD5E1'},
                     left={'val': 'single', 'sz': 6, 'color': 'CBD5E1'},
                     right={'val': 'single', 'sz': 6, 'color': 'CBD5E1'})
    
    p1_hdr = c1.paragraphs[0]
    p1_hdr.paragraph_format.space_after = Pt(8)
    r1_hdr = p1_hdr.add_run("FOR THE SERVICE PROVIDER — INDIVIDUAL")
    r1_hdr.font.name = "Calibri"
    r1_hdr.font.size = Pt(10.5)
    r1_hdr.bold = True
    r1_hdr.font.color.rgb = NAVY
    
    p1_sig = c1.add_paragraph()
    p1_sig.paragraph_format.space_after = Pt(4)
    p1_sig.paragraph_format.line_spacing = 1.3
    add_formatted_runs(p1_sig, "Signature:  _____________________________________\n\n"
                               "Full legal name:  Umesh Shetty\n"
                               "Proposed business name:  Octagram\n"
                               "Address:  841, 10th cross, 26th main, Sector-1, HSR Layout, Bangalore 560102\n"
                               "Date:  __________________________________________\n")
    
    p1_wit_hdr = c1.add_paragraph()
    p1_wit_hdr.paragraph_format.space_before = Pt(6)
    p1_wit_hdr.paragraph_format.space_after = Pt(2)
    r1_w = p1_wit_hdr.add_run("WITNESSES:")
    r1_w.font.name = "Calibri"
    r1_w.font.size = Pt(9)
    r1_w.bold = True
    r1_w.font.color.rgb = SLATE_NAVY
    
    p1_w1 = c1.add_paragraph()
    p1_w1.paragraph_format.space_after = Pt(4)
    p1_w1.paragraph_format.line_spacing = 1.25
    add_formatted_runs(p1_w1, "**Witness 1:**\n"
                              "Name:  __________________________________________\n"
                              "Address:  _______________________________________\n"
                              "Signature:  _____________________________________\n")
    
    p1_w2 = c1.add_paragraph()
    p1_w2.paragraph_format.space_after = Pt(2)
    p1_w2.paragraph_format.line_spacing = 1.25
    add_formatted_runs(p1_w2, "**Witness 2:**\n"
                              "Name:  __________________________________________\n"
                              "Address:  _______________________________________\n"
                              "Signature:  _____________________________________\n")
    
    # Right: SweafEx
    c2 = table.rows[0].cells[1]
    c2.width = col_widths[1]
    set_cell_margins(c2, top=140, bottom=140, left=140, right=140)
    set_cell_shading(c2, "FAFAFA")
    set_cell_borders(c2, 
                     top={'val': 'single', 'sz': 8, 'color': '0F2557'},
                     bottom={'val': 'single', 'sz': 6, 'color': 'CBD5E1'},
                     left={'val': 'single', 'sz': 6, 'color': 'CBD5E1'},
                     right={'val': 'single', 'sz': 6, 'color': 'CBD5E1'})
    
    p2_hdr = c2.paragraphs[0]
    p2_hdr.paragraph_format.space_after = Pt(8)
    r2_hdr = p2_hdr.add_run("FOR SWEAFEX — CLIENT")
    r2_hdr.font.name = "Calibri"
    r2_hdr.font.size = Pt(10.5)
    r2_hdr.bold = True
    r2_hdr.font.color.rgb = NAVY
    
    p2_sig = c2.add_paragraph()
    p2_sig.paragraph_format.space_after = Pt(4)
    p2_sig.paragraph_format.line_spacing = 1.3
    add_formatted_runs(p2_sig, "Full legal name:  Sweaf Express Pvt Ltd\n"
                               "Trading name:  SweafEx\n"
                               "Authorised signatory:  ___________________________\n"
                               "Designation:  ___________________________________\n"
                               "Signature:  _____________________________________\n"
                               "Date:  __________________________________________\n"
                               "Company seal (if applicable):  ___________________\n")
    
    p2_wit_hdr = c2.add_paragraph()
    p2_wit_hdr.paragraph_format.space_before = Pt(6)
    p2_wit_hdr.paragraph_format.space_after = Pt(2)
    r2_w = p2_wit_hdr.add_run("WITNESSES:")
    r2_w.font.name = "Calibri"
    r2_w.font.size = Pt(9)
    r2_w.bold = True
    r2_w.font.color.rgb = SLATE_NAVY
    
    p2_w1 = c2.add_paragraph()
    p2_w1.paragraph_format.space_after = Pt(4)
    p2_w1.paragraph_format.line_spacing = 1.25
    add_formatted_runs(p2_w1, "**Witness 1:**\n"
                              "Name:  __________________________________________\n"
                              "Address:  _______________________________________\n"
                              "Signature:  _____________________________________\n")
    
    p2_w2 = c2.add_paragraph()
    p2_w2.paragraph_format.space_after = Pt(2)
    p2_w2.paragraph_format.line_spacing = 1.25
    add_formatted_runs(p2_w2, "**Witness 2:**\n"
                              "Name:  __________________________________________\n"
                              "Address:  _______________________________________\n"
                              "Signature:  _____________________________________\n")
    
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

def add_drafting_status_box(doc, text):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    cell = table.rows[0].cells[0]
    cell.width = Inches(6.8)
    set_cell_margins(cell, top=120, bottom=120, left=160, right=160)
    set_cell_shading(cell, "FFFBEB")
    set_cell_borders(cell, 
                     top={'val': 'single', 'sz': 8, 'color': 'D97706'},
                     bottom={'val': 'single', 'sz': 8, 'color': 'D97706'},
                     left={'val': 'single', 'sz': 12, 'color': 'D97706'},
                     right={'val': 'single', 'sz': 8, 'color': 'D97706'})
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.2
    
    # Strip markdown **DRAFTING STATUS:** if present
    content = text
    if content.startswith('**DRAFTING STATUS:**'):
        content = content[len('**DRAFTING STATUS:**'):].strip()
    
    r_hdr = p.add_run("DRAFTING STATUS & LEGAL REVIEW ADVISORY: ")
    r_hdr.font.name = "Calibri"
    r_hdr.font.size = Pt(9.5)
    r_hdr.bold = True
    r_hdr.font.color.rgb = RGBColor(180, 83, 9) # Amber 700
    
    r_body = p.add_run(content)
    r_body.font.name = "Calibri"
    r_body.font.size = Pt(9)
    r_body.font.color.rgb = RGBColor(120, 53, 15) # Amber 900
    
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

print("Builder components defined successfully.")

def generate_document():
    doc = init_doc()
    
    with open('contract.txt', 'r', encoding='utf-8') as f:
        raw_text = f.read()
        
    lines = [l.rstrip() for l in raw_text.splitlines()]
    n = len(lines)
    i = 0
    
    while i < n:
        line = lines[i]
        if not line:
            i += 1
            continue
            
        # Title block
        if line.startswith('# SOFTWARE DEVELOPMENT'):
            title = line[2:].strip()
            i += 1
            while i < n and not lines[i]:
                i += 1
            sub = lines[i].replace('**', '').strip()
            i += 1
            while i < n and not lines[i]:
                i += 1
            lead = lines[i]
            add_title_block(doc, title, sub, lead)
            i += 1
            continue
            
        # BETWEEN section
        if line == '## BETWEEN':
            add_h1(doc, "BETWEEN")
            i += 1
            continue
            
        if line == '**1. SERVICE PROVIDER**':
            p_sp = doc.add_paragraph()
            p_sp.paragraph_format.space_before = Pt(8)
            p_sp.paragraph_format.space_after = Pt(2)
            p_sp.paragraph_format.keep_with_next = True
            r_sp = p_sp.add_run("1.  SERVICE PROVIDER")
            r_sp.font.name = "Calibri"
            r_sp.font.size = Pt(11)
            r_sp.bold = True
            r_sp.font.color.rgb = SLATE_NAVY
            i += 1
            continue
            
        if line == '**AND**':
            p_and = doc.add_paragraph()
            p_and.paragraph_format.space_before = Pt(6)
            p_and.paragraph_format.space_after = Pt(6)
            p_and.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r_and = p_and.add_run("— AND —")
            r_and.font.name = "Calibri"
            r_and.font.size = Pt(10)
            r_and.bold = True
            r_and.font.color.rgb = MUTED
            i += 1
            continue
            
        if line == '**2. CLIENT**':
            p_cl = doc.add_paragraph()
            p_cl.paragraph_format.space_before = Pt(8)
            p_cl.paragraph_format.space_after = Pt(2)
            p_cl.paragraph_format.keep_with_next = True
            r_cl = p_cl.add_run("2.  CLIENT")
            r_cl.font.name = "Calibri"
            r_cl.font.size = Pt(11)
            r_cl.bold = True
            r_cl.font.color.rgb = SLATE_NAVY
            i += 1
            continue
            
        # Schedules with page break
        if line.startswith('## SCHEDULE 1'):
            doc.add_page_break()
            add_h1(doc, line[3:].strip())
            i += 1
            continue
            
        if line.startswith('## SCHEDULE 2'):
            doc.add_page_break()
            add_h1(doc, line[3:].strip())
            i += 1
            continue
            
        if line.startswith('## SCHEDULE 3'):
            doc.add_page_break()
            add_h1(doc, line[3:].strip())
            i += 1
            continue
            
        if line.startswith('## SCHEDULE 4'):
            doc.add_page_break()
            add_h1(doc, line[3:].strip())
            i += 1
            continue
            
        # SIGNATURES with page break
        if line == '## SIGNATURES':
            doc.add_page_break()
            add_h1(doc, "SIGNATURES & EXECUTION")
            i += 1
            continue
            
        # Headings 1 (Main Clauses)
        if line.startswith('## '):
            add_h1(doc, line[3:].strip())
            i += 1
            continue
            
        # Headings 2 (Subclauses or sections)
        if line.startswith('### '):
            # Check if this is signature subheadings
            if 'For the Service Provider' in line or 'For SweafEx' in line:
                # We skip and handle in execution block
                i += 1
                continue
            add_h2(doc, line[4:].strip())
            i += 1
            continue
            
        # Clause 4.2 Table handling
        if line.startswith('| Payment | Description |'):
            # Consume raw markdown table lines
            while i < n and lines[i].startswith('|'):
                i += 1
            add_commercial_table(doc)
            continue
            
        # Schedule 2 Table handling
        if line.startswith('| Stage | Target period |'):
            while i < n and lines[i].startswith('|'):
                i += 1
            add_schedule2_table(doc)
            continue
            
        # Schedule 4 Table handling
        if line.startswith('| Service | Responsibility to be confirmed |'):
            while i < n and lines[i].startswith('|'):
                i += 1
            add_schedule4_table(doc)
            continue
            
        # Clause 18 Notices handling
        if line == '**For the Service Provider**':
            # Skip until after SweafEx notice lines
            while i < n and lines[i] != '18.2. Notices by email shall be deemed received when acknowledged by the recipient or when receipt is otherwise reliably evidenced, subject to applicable law. A routine project communication shall not amend this Agreement unless it satisfies the applicable amendment requirements.':
                i += 1
            add_notices_card(doc)
            continue
            
        # Schedule 1 Document Identification handling
        if 'The Parties shall complete the following document identification before execution:' in line:
            # Skip until next section
            while i < n and not lines[i].startswith('## SCHEDULE 2'):
                i += 1
            add_schedule1_doc_id(doc)
            continue
            
        # Signature block lines handling
        if 'Signature: ______________________________' in line or 'Witness 1:' in line:
            # Skip until DRAFTING STATUS
            while i < n and not lines[i].startswith('**DRAFTING STATUS:**'):
                i += 1
            add_execution_block(doc)
            continue
            
        # Drafting status callout
        if line.startswith('**DRAFTING STATUS:**'):
            add_drafting_status_box(doc, line)
            i += 1
            continue
            
        if line.startswith('---'):
            i += 1
            continue
            
        # Subclauses: 1.1., 4.3.1., etc.
        if re.match(r'^[0-9]+\.[0-9]+(\.[0-9]+)?\.\s', line):
            add_clause_p(doc, line)
            i += 1
            continue
            
        # Numbered list in Schedule 3: 1., 2., etc.
        if re.match(r'^[0-9]+\.\s', line):
            add_clause_p(doc, line)
            i += 1
            continue
            
        # Lettered items: (a), (b), etc.
        if re.match(r'^\([a-z]\)\s', line):
            add_lettered_p(doc, line)
            i += 1
            continue
            
        # Bullet items: - ...
        if line.startswith('- '):
            add_bullet_p(doc, line)
            i += 1
            continue
            
        # Standard paragraphs
        add_body_p(doc, line)
        i += 1
        
    output_path = "SweafEx_Octagram_Software_Development_Agreement.docx"
    doc.save(output_path)
    print(f"Agreement saved successfully to {output_path}")

if __name__ == '__main__':
    generate_document()
