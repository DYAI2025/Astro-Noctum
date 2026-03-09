#!/usr/bin/env python3
"""
AstroMirror Partnership Analysis PDF Generator
Wiederverwendbares Template-System für Premium-Partnerschaftsanalysen
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Flowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
import math
from dataclasses import dataclass, field
from typing import List, Dict, Tuple, Optional
from datetime import datetime
import json


# ═══════════════════════════════════════════════════════════════════════════════
# DESIGN TOKENS
# ═══════════════════════════════════════════════════════════════════════════════

class Theme:
    BG_OBSIDIAN = HexColor('#070708')
    SURFACE_GRAPHITE = HexColor('#0F1012')
    GOLD_PRIMARY = HexColor('#D4AF37')
    GOLD_MUTED = HexColor('#B8975E')
    GOLD_LIGHT = HexColor('#E8D5A3')
    EMERALD_DEEP = HexColor('#0F3D2E')
    EMERALD_GLOW = HexColor('#2D8B6F')
    TEXT_IVORY = HexColor('#F6F0E1')
    TEXT_MIST = HexColor('#CFC7B8')
    TEXT_DIM = HexColor('#8A8578')
    
    # Print-friendly
    BG_PAPER = HexColor('#FDFBF7')
    BG_CREAM = HexColor('#F5F1E8')
    TEXT_DARK = HexColor('#1A1A1A')
    TEXT_SECONDARY = HexColor('#4A4A4A')
    
    # Wu Xing Elements
    WOOD = HexColor('#2D5A3D')
    FIRE = HexColor('#8B2E2E')
    EARTH = HexColor('#8B7355')
    METAL = HexColor('#A0A0A0')
    WATER = HexColor('#1E3A5F')


# ═══════════════════════════════════════════════════════════════════════════════
# DATA MODELS
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class Person:
    name: str
    birth_date: str
    birth_place: str
    birth_time: str = ""
    day_element: str = ""
    day_element_symbol: str = ""
    chinese_animal: str = ""
    chinese_element: str = ""
    western_sun: str = ""
    western_ascendant: str = ""
    archetype_title: str = ""
    archetype_description: str = ""
    core_traits: List[str] = field(default_factory=list)
    pillars: Dict[str, str] = field(default_factory=dict)

@dataclass
class ElementBalance:
    wood: float = 0.0
    fire: float = 0.0
    earth: float = 0.0
    metal: float = 0.0
    water: float = 0.0

@dataclass
class PartnershipDynamic:
    attraction_type: str = ""
    tension_field: str = ""
    growth_axis: str = ""
    mediator_element: str = ""
    key_challenges: List[str] = field(default_factory=list)
    key_strengths: List[str] = field(default_factory=list)

@dataclass
class LifeCycle:
    period: str
    theme: str
    development: str
    element_influence: str = ""

@dataclass
class PartnershipAnalysis:
    person_a: Person
    person_b: Person
    element_balance: ElementBalance
    dynamics: PartnershipDynamic
    cycles: List[LifeCycle] = field(default_factory=list)
    current_year_prognosis: str = ""
    current_year_theme: str = ""
    strategy_career: str = ""
    strategy_behavior: str = ""
    strategy_environment: str = ""
    strategy_health: str = ""
    generated_at: str = field(default_factory=lambda: datetime.now().isoformat())


# ═══════════════════════════════════════════════════════════════════════════════
# CUSTOM FLOWABLES
# ═══════════════════════════════════════════════════════════════════════════════

class GoldDivider(Flowable):
    def __init__(self, width: float = 400, style: str = "ornate"):
        Flowable.__init__(self)
        self.line_width = width
        self.style = style
        self.width = width
        self.height = 20
        
    def draw(self):
        mid = self.line_width / 2
        y = 10
        
        self.canv.setFillColor(Theme.GOLD_PRIMARY)
        self.canv.setStrokeColor(Theme.GOLD_PRIMARY)
        self.canv.setLineWidth(0.5)
        
        if self.style == "ornate":
            self.canv.line(20, y, mid - 15, y)
            self.canv.saveState()
            self.canv.translate(mid, y)
            self.canv.rotate(45)
            self.canv.rect(-4, -4, 8, 8, fill=1, stroke=0)
            self.canv.restoreState()
            self.canv.circle(mid - 20, y, 2, fill=1, stroke=0)
            self.canv.circle(mid + 20, y, 2, fill=1, stroke=0)
            self.canv.line(mid + 15, y, self.line_width - 20, y)
        else:
            self.canv.setStrokeColor(Theme.GOLD_MUTED)
            self.canv.line(0, y, self.line_width, y)


class ElementBalanceChart(Flowable):
    def __init__(self, balance: ElementBalance, width: float = 400, height: float = 150):
        Flowable.__init__(self)
        self.balance = balance
        self.chart_width = width
        self.chart_height = height
        self.width = width
        self.height = height
        
    def draw(self):
        elements = [
            ("Holz", self.balance.wood, Theme.WOOD),
            ("Feuer", self.balance.fire, Theme.FIRE),
            ("Erde", self.balance.earth, Theme.EARTH),
            ("Metall", self.balance.metal, Theme.METAL),
            ("Wasser", self.balance.water, Theme.WATER),
        ]
        
        bar_height = 18
        spacing = 8
        max_bar_width = self.chart_width - 100
        start_x = 70
        
        for i, (name, value, color) in enumerate(elements):
            y = self.chart_height - 30 - (i * (bar_height + spacing))
            
            self.canv.setFillColor(Theme.TEXT_DARK)
            self.canv.setFont("Helvetica", 10)
            self.canv.drawRightString(start_x - 10, y + 4, name)
            
            self.canv.setFillColor(HexColor('#E8E4DC'))
            self.canv.roundRect(start_x, y, max_bar_width, bar_height, 3, fill=1, stroke=0)
            
            bar_width = (value / 100) * max_bar_width
            self.canv.setFillColor(color)
            self.canv.roundRect(start_x, y, bar_width, bar_height, 3, fill=1, stroke=0)
            
            if bar_width > 5:
                self.canv.setFillColor(Theme.GOLD_PRIMARY)
                self.canv.roundRect(start_x + bar_width - 4, y, 4, bar_height, 2, fill=1, stroke=0)
            
            self.canv.setFillColor(Theme.TEXT_DARK)
            self.canv.setFont("Helvetica-Bold", 9)
            self.canv.drawString(start_x + max_bar_width + 8, y + 4, f"{int(value)}%")


class InneresTeamDiagram(Flowable):
    def __init__(self, values_a: Dict[str, float], values_b: Dict[str, float], 
                 names: Tuple[str, str], size: float = 200):
        Flowable.__init__(self)
        self.values_a = values_a
        self.values_b = values_b
        self.names = names
        self.size = size
        self.width = size + 100
        self.height = size + 60
        
    def draw(self):
        center_x = self.width / 2
        center_y = self.height / 2 + 10
        radius = self.size / 2 - 20
        
        aspects = ["Einfluss", "Ausdruck", "Resultate", "Ressourcen", "Netzwerk"]
        
        points = []
        for i in range(5):
            angle = math.radians(90 + i * 72)
            x = center_x + radius * math.cos(angle)
            y = center_y + radius * math.sin(angle)
            points.append((x, y))
        
        # Pentagon outline
        self.canv.setStrokeColor(HexColor('#D4D0C8'))
        self.canv.setLineWidth(1)
        for i in range(5):
            self.canv.line(points[i][0], points[i][1], 
                          points[(i+1)%5][0], points[(i+1)%5][1])
        
        # Rings
        for scale in [0.25, 0.5, 0.75]:
            ring_points = []
            for i in range(5):
                angle = math.radians(90 + i * 72)
                x = center_x + radius * scale * math.cos(angle)
                y = center_y + radius * scale * math.sin(angle)
                ring_points.append((x, y))
            
            self.canv.setStrokeColor(HexColor('#E8E4DC'))
            self.canv.setLineWidth(0.5)
            for i in range(5):
                self.canv.line(ring_points[i][0], ring_points[i][1],
                              ring_points[(i+1)%5][0], ring_points[(i+1)%5][1])
        
        self._draw_polygon(center_x, center_y, radius, self.values_a, aspects, Theme.GOLD_PRIMARY, 0.3)
        self._draw_polygon(center_x, center_y, radius, self.values_b, aspects, Theme.EMERALD_GLOW, 0.3)
        
        # Labels
        label_radius = radius + 25
        self.canv.setFillColor(Theme.TEXT_DARK)
        self.canv.setFont("Helvetica-Bold", 9)
        
        for i, aspect in enumerate(aspects):
            angle = math.radians(90 + i * 72)
            x = center_x + label_radius * math.cos(angle)
            y = center_y + label_radius * math.sin(angle)
            
            if i == 0:
                self.canv.drawCentredString(x, y, aspect)
            elif i in [1, 2]:
                self.canv.drawString(x - 10, y - 4, aspect)
            else:
                self.canv.drawRightString(x + 10, y - 4, aspect)
        
        # Legend
        legend_y = 15
        self.canv.setFillColor(Theme.GOLD_PRIMARY)
        self.canv.rect(center_x - 80, legend_y, 12, 12, fill=1, stroke=0)
        self.canv.setFillColor(Theme.TEXT_DARK)
        self.canv.setFont("Helvetica", 8)
        self.canv.drawString(center_x - 65, legend_y + 2, self.names[0])
        
        self.canv.setFillColor(Theme.EMERALD_GLOW)
        self.canv.rect(center_x + 20, legend_y, 12, 12, fill=1, stroke=0)
        self.canv.setFillColor(Theme.TEXT_DARK)
        self.canv.drawString(center_x + 35, legend_y + 2, self.names[1])
    
    def _draw_polygon(self, cx, cy, radius, values, aspects, color, alpha):
        points = []
        for i, aspect in enumerate(aspects):
            angle = math.radians(90 + i * 72)
            value = values.get(aspect, 50) / 100
            x = cx + radius * value * math.cos(angle)
            y = cy + radius * value * math.sin(angle)
            points.append((x, y))
        
        path = self.canv.beginPath()
        path.moveTo(points[0][0], points[0][1])
        for x, y in points[1:]:
            path.lineTo(x, y)
        path.close()
        
        self.canv.setFillColor(color)
        self.canv.setFillAlpha(alpha)
        self.canv.drawPath(path, fill=1, stroke=0)
        self.canv.setFillAlpha(1)
        
        self.canv.setStrokeColor(color)
        self.canv.setLineWidth(2)
        for i in range(5):
            self.canv.line(points[i][0], points[i][1],
                          points[(i+1)%5][0], points[(i+1)%5][1])
        
        for x, y in points:
            self.canv.setFillColor(color)
            self.canv.circle(x, y, 4, fill=1, stroke=0)


# ═══════════════════════════════════════════════════════════════════════════════
# PDF GENERATOR
# ═══════════════════════════════════════════════════════════════════════════════

class AstroMirrorPDF:
    def __init__(self, analysis: PartnershipAnalysis, output_path: str):
        self.analysis = analysis
        self.output_path = output_path
        self.page_width, self.page_height = A4
        self.margin = 50
        self.content_width = self.page_width - 2 * self.margin
        self._setup_styles()
        
    def _setup_styles(self):
        self.styles = getSampleStyleSheet()
        
        self.styles.add(ParagraphStyle(
            name='AstroTitle',
            fontName='Helvetica-Bold',
            fontSize=28,
            textColor=Theme.GOLD_PRIMARY,
            alignment=TA_CENTER,
            spaceAfter=6,
        ))
        
        self.styles.add(ParagraphStyle(
            name='AstroSubtitle',
            fontName='Helvetica',
            fontSize=14,
            textColor=Theme.TEXT_SECONDARY,
            alignment=TA_CENTER,
            spaceAfter=20,
        ))
        
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            fontName='Helvetica-Bold',
            fontSize=16,
            textColor=Theme.GOLD_PRIMARY,
            spaceBefore=25,
            spaceAfter=12,
        ))
        
        self.styles.add(ParagraphStyle(
            name='SubsectionHeader',
            fontName='Helvetica-Bold',
            fontSize=12,
            textColor=Theme.TEXT_DARK,
            spaceBefore=15,
            spaceAfter=8,
        ))
        
        self.styles.add(ParagraphStyle(
            name='AstroBody',
            fontName='Helvetica',
            fontSize=10,
            textColor=Theme.TEXT_DARK,
            alignment=TA_JUSTIFY,
            spaceAfter=8,
            leading=14,
        ))
        
        self.styles.add(ParagraphStyle(
            name='AstroQuote',
            fontName='Helvetica-Oblique',
            fontSize=11,
            textColor=Theme.TEXT_SECONDARY,
            alignment=TA_CENTER,
            spaceBefore=15,
            spaceAfter=15,
            leftIndent=30,
            rightIndent=30,
        ))
        
        self.styles.add(ParagraphStyle(
            name='ArchetypeTitle',
            fontName='Helvetica-Bold',
            fontSize=13,
            textColor=Theme.GOLD_PRIMARY,
            spaceAfter=4,
        ))
        
        self.styles.add(ParagraphStyle(
            name='AstroSmall',
            fontName='Helvetica',
            fontSize=8,
            textColor=Theme.TEXT_SECONDARY,
            alignment=TA_CENTER,
        ))
        
        self.styles.add(ParagraphStyle(
            name='Disclaimer',
            fontName='Helvetica',
            fontSize=8,
            textColor=Theme.TEXT_SECONDARY,
            alignment=TA_JUSTIFY,
            spaceBefore=20,
            leading=10,
        ))

    def generate(self):
        doc = SimpleDocTemplate(
            self.output_path,
            pagesize=A4,
            leftMargin=self.margin,
            rightMargin=self.margin,
            topMargin=self.margin,
            bottomMargin=self.margin
        )
        
        story = []
        story.extend(self._title_page())
        story.append(PageBreak())
        story.extend(self._introduction())
        story.extend(self._cosmic_dashboard())
        story.append(PageBreak())
        story.extend(self._core_identities())
        story.append(PageBreak())
        story.extend(self._element_balance())
        story.append(PageBreak())
        story.extend(self._inner_team())
        story.append(PageBreak())
        story.extend(self._core_dynamics())
        story.append(PageBreak())
        story.extend(self._strategies())
        story.append(PageBreak())
        story.extend(self._closing())
        
        doc.build(story, onFirstPage=self._page_template, onLaterPages=self._page_template)
        return self.output_path

    def _page_template(self, canvas, doc):
        canvas.saveState()
        
        canvas.setStrokeColor(Theme.GOLD_MUTED)
        canvas.setLineWidth(0.5)
        canvas.rect(25, 25, self.page_width - 50, self.page_height - 50, stroke=1, fill=0)
        
        corner_size = 15
        corners = [
            (30, 30),
            (self.page_width - 30 - corner_size, 30),
            (30, self.page_height - 30 - corner_size),
            (self.page_width - 30 - corner_size, self.page_height - 30 - corner_size)
        ]
        
        canvas.setFillColor(Theme.GOLD_PRIMARY)
        for x, y in corners:
            canvas.rect(x, y, corner_size, 2, fill=1, stroke=0)
            canvas.rect(x, y, 2, corner_size, fill=1, stroke=0)
        
        canvas.setFillColor(Theme.TEXT_DIM)
        canvas.setFont("Helvetica", 8)
        canvas.drawCentredString(self.page_width / 2, 35, "AstroMirror Analytics")
        
        page_num = canvas.getPageNumber()
        canvas.drawRightString(self.page_width - 40, 35, f"Seite {page_num}")
        
        canvas.restoreState()

    def _title_page(self) -> List:
        story = []
        story.append(Spacer(1, 80))
        story.append(Paragraph("AstroMirror", self.styles['AstroTitle']))
        story.append(Paragraph("Analytics", self.styles['AstroSubtitle']))
        story.append(Spacer(1, 30))
        story.append(GoldDivider(self.content_width, "ornate"))
        story.append(Spacer(1, 30))
        story.append(Paragraph("Ihre Persönliche Resonanzanalyse", self.styles['SectionHeader']))
        story.append(Paragraph("Einblicke in Ihre Kosmische DNA", self.styles['AstroSubtitle']))
        story.append(Spacer(1, 50))
        
        names_text = f"<b>{self.analysis.person_a.name}</b> &amp; <b>{self.analysis.person_b.name}</b>"
        story.append(Paragraph(names_text, self.styles['AstroBody']))
        
        birth_a = f"{self.analysis.person_a.birth_date}, {self.analysis.person_a.birth_place}"
        birth_b = f"{self.analysis.person_b.birth_date}, {self.analysis.person_b.birth_place}"
        story.append(Paragraph(birth_a, self.styles['AstroSmall']))
        story.append(Paragraph(birth_b, self.styles['AstroSmall']))
        
        story.append(Spacer(1, 60))
        story.append(GoldDivider(self.content_width * 0.6, "simple"))
        story.append(Spacer(1, 20))
        
        quote = "Wenn Metall das Wasser fuehrt und Holz in der Erde wurzelt, wird Liebe zu Bewusstheit."
        story.append(Paragraph(quote, self.styles['AstroQuote']))
        
        return story

    def _introduction(self) -> List:
        story = []
        story.append(Paragraph("Eine strategische Landkarte", self.styles['SectionHeader']))
        
        intro = (
            "Diese Analyse dient als energetische Landkarte Ihrer Beziehung. "
            "Sie beschreibt keine unabänderliche Zukunft, sondern zeigt "
            "<b>Muster, Dynamiken und Potenziale</b> - eine Art <i>Kosmische DNA Ihrer Verbindung</i>. "
            "<br/><br/>"
            "Ba Zi (Die Vier Säulen des Schicksals), westliche Astrologie und systemische "
            "Resonanzarbeit verbinden sich hier zu einem strategischen Werkzeug. "
            "<br/><br/>"
            "<b>Betrachten Sie es als die Gebrauchsanweisung für Ihre Beziehung.</b>"
        )
        story.append(Paragraph(intro, self.styles['AstroBody']))
        story.append(Spacer(1, 15))
        story.append(GoldDivider(self.content_width * 0.4, "simple"))
        
        return story

    def _cosmic_dashboard(self) -> List:
        story = []
        story.append(Paragraph("Das Kosmische Dashboard", self.styles['SectionHeader']))
        
        dashboard_intro = (
            "Die Vier Säulen repräsentieren den energetischen Fingerabdruck Ihrer Verbindung. "
            "Traditionell wird das Chart von rechts (Jahr) nach links (Stunde) gelesen."
        )
        story.append(Paragraph(dashboard_intro, self.styles['AstroBody']))
        
        pillar_data = [
            ["Säule", "Symbolik", self.analysis.person_a.name, self.analysis.person_b.name],
            ["Jahr (Ahnen)", "Wurzeln", 
             self.analysis.person_a.pillars.get("Jahr", "-"),
             self.analysis.person_b.pillars.get("Jahr", "-")],
            ["Monat (Emotion)", "Resonanz",
             self.analysis.person_a.pillars.get("Monat", "-"),
             self.analysis.person_b.pillars.get("Monat", "-")],
            ["Tag (Selbst)", "Kern",
             self.analysis.person_a.pillars.get("Tag", "-"),
             self.analysis.person_b.pillars.get("Tag", "-")],
            ["Stunde (Zukunft)", "Ambitionen",
             self.analysis.person_a.pillars.get("Stunde", "-"),
             self.analysis.person_b.pillars.get("Stunde", "-")],
        ]
        
        table = Table(pillar_data, colWidths=[100, 100, 120, 120])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), Theme.GOLD_MUTED),
            ('TEXTCOLOR', (0, 0), (-1, 0), Theme.BG_PAPER),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('BACKGROUND', (0, 1), (-1, -1), Theme.BG_CREAM),
            ('TEXTCOLOR', (0, 1), (-1, -1), Theme.TEXT_DARK),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ALIGN', (0, 1), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, Theme.GOLD_MUTED),
            ('ROWHEIGHT', (0, 1), (-1, -1), 30),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        story.append(Spacer(1, 15))
        story.append(table)
        
        return story

    def _core_identities(self) -> List:
        story = []
        story.append(Paragraph("Eure Kernidentität", self.styles['SectionHeader']))
        
        for person in [self.analysis.person_a, self.analysis.person_b]:
            title = f"<b>{person.name}</b> - <i>{person.archetype_title}</i>"
            story.append(Paragraph(title, self.styles['ArchetypeTitle']))
            
            attr_text = (
                f"<b>Tageselement:</b> {person.day_element} {person.day_element_symbol}<br/>"
                f"<b>Chinesisches Tier:</b> {person.chinese_element}-{person.chinese_animal}<br/>"
                f"<b>Westlich:</b> {person.western_sun} (Sonne) / {person.western_ascendant} (Aszendent)"
            )
            story.append(Paragraph(attr_text, self.styles['AstroBody']))
            
            if person.archetype_description:
                story.append(Paragraph(person.archetype_description, self.styles['AstroBody']))
            
            if person.core_traits:
                traits = " / ".join(person.core_traits[:5])
                story.append(Paragraph(f"<i>Kernqualitäten: {traits}</i>", self.styles['AstroSmall']))
            
            story.append(Spacer(1, 15))
            story.append(GoldDivider(self.content_width * 0.3, "simple"))
            story.append(Spacer(1, 15))
        
        return story

    def _element_balance(self) -> List:
        story = []
        story.append(Paragraph("Das Klima Ihrer Verbindung", self.styles['SectionHeader']))
        
        balance_intro = (
            "Ein Ba Zi Chart ist ein Ökosystem aus fünf Elementen. "
            "Die Balance dieser Elemente bestimmt das innere Klima Ihrer Beziehung."
        )
        story.append(Paragraph(balance_intro, self.styles['AstroBody']))
        
        story.append(Spacer(1, 20))
        story.append(ElementBalanceChart(self.analysis.element_balance, self.content_width, 160))
        story.append(Spacer(1, 20))
        
        b = self.analysis.element_balance
        interpretations = []
        if b.water >= 25:
            interpretations.append("<b>Wasser:</b> Tiefe emotionale Verbundenheit, intuitive Kommunikation.")
        if b.metal >= 25:
            interpretations.append("<b>Metall:</b> Rationalität, klare Grenzsetzung, analytische Klarheit.")
        if b.wood >= 20:
            interpretations.append("<b>Holz:</b> Kontinuierliches Wachstum, kreative Energie.")
        if b.earth >= 20:
            interpretations.append("<b>Erde:</b> Stabilität, Vertrauen, gemeinsame Basis.")
        if b.fire >= 15:
            interpretations.append("<b>Feuer:</b> Leidenschaft und Transformation.")
        
        for interp in interpretations:
            story.append(Paragraph(interp, self.styles['AstroBody']))
        
        return story

    def _inner_team(self) -> List:
        story = []
        story.append(Paragraph("Ihr Inneres Team als Paar", self.styles['SectionHeader']))
        
        team_intro = (
            "Die fünf Aspekte Ihrer Beziehung zeigen, wie Ihre individuellen Stärken zusammenwirken."
        )
        story.append(Paragraph(team_intro, self.styles['AstroBody']))
        
        aspects_text = (
            "<b>Einfluss:</b> Führungsstil / <b>Ausdruck:</b> Kreativität / "
            "<b>Resultate:</b> Kontrolle / <b>Ressourcen:</b> Stabilität / <b>Netzwerk:</b> Kollaboration"
        )
        story.append(Paragraph(aspects_text, self.styles['AstroBody']))
        
        story.append(Spacer(1, 20))
        
        values_a = {"Einfluss": 75, "Ausdruck": 85, "Resultate": 60, "Ressourcen": 50, "Netzwerk": 70}
        values_b = {"Einfluss": 55, "Ausdruck": 65, "Resultate": 80, "Ressourcen": 75, "Netzwerk": 80}
        
        diagram = InneresTeamDiagram(
            values_a, values_b,
            (self.analysis.person_a.name, self.analysis.person_b.name),
            size=220
        )
        story.append(diagram)
        
        return story

    def _core_dynamics(self) -> List:
        story = []
        story.append(Paragraph("Kerndynamik - Zwischen Tiefe und Distanz", self.styles['SectionHeader']))
        
        dynamics = self.analysis.dynamics
        
        if dynamics.attraction_type:
            story.append(Paragraph(f"<b>Anziehungsfeld:</b> {dynamics.attraction_type}", self.styles['AstroBody']))
        
        if dynamics.tension_field:
            story.append(Paragraph(f"<b>Spannungsfeld:</b> {dynamics.tension_field}", self.styles['AstroBody']))
        
        if dynamics.growth_axis:
            story.append(Paragraph(f"<b>Wachstumsachse:</b> {dynamics.growth_axis}", self.styles['AstroBody']))
        
        if dynamics.key_strengths:
            story.append(Paragraph("<b>Kernstärken:</b>", self.styles['SubsectionHeader']))
            for strength in dynamics.key_strengths:
                story.append(Paragraph(f"• {strength}", self.styles['AstroBody']))
        
        if dynamics.key_challenges:
            story.append(Paragraph("<b>Entwicklungsfelder:</b>", self.styles['SubsectionHeader']))
            for challenge in dynamics.key_challenges:
                story.append(Paragraph(f"• {challenge}", self.styles['AstroBody']))
        
        if dynamics.mediator_element:
            story.append(Spacer(1, 15))
            story.append(Paragraph(
                f"<b>Strategischer Schlüssel:</b> Die <b>{dynamics.mediator_element}</b> als Mediator",
                self.styles['SubsectionHeader']
            ))
            
            mediator_texts = {
                "Erde": "Die Erde vermittelt zwischen Bewegung und Gefühl. Sie kühlt das Feuer der Leidenschaft und stabilisiert die Metall-Struktur durch Mitgefühl.",
                "Wasser": "Wasser harmonisiert Struktur und Expansion. Es fliesst um Hindernisse, schafft Raum für emotionale Tiefe.",
                "Holz": "Holz bringt Wachstum und Flexibilität, transformiert Starre und kanalisiert Tiefe in aufwärts gerichtete Energie.",
                "Metall": "Metall schafft Klarheit und Struktur, schneidet durch emotionale Verstrickungen.",
                "Feuer": "Feuer bringt Wärme und Transformation, schmilzt festgefahrene Muster."
            }
            text = mediator_texts.get(dynamics.mediator_element, "Die bewusste Aktivierung dieses Elements fördert Ihre Balance.")
            story.append(Paragraph(text, self.styles['AstroBody']))
        
        return story

    def _strategies(self) -> List:
        story = []
        story.append(Paragraph("Ihre Strategie für Balance und Erfolg", self.styles['SectionHeader']))
        
        strategies = [
            ("Karriere", self.analysis.strategy_career or "Kombinieren Sie analytische Klarheit mit Empathie."),
            ("Verhalten", self.analysis.strategy_behavior or "Pflegen Sie diplomatische Sprache und ehrliche Tiefe."),
            ("Umfeld", self.analysis.strategy_environment or "Suchen Sie Räume mit harmonisierenden Qualitäten."),
            ("Gesundheit", self.analysis.strategy_health or "Erdung und Schlaf sind Ihr Regenerationsanker."),
        ]
        
        for title, text in strategies:
            story.append(Paragraph(f"<b>{title}:</b> {text}", self.styles['AstroBody']))
        
        story.append(Spacer(1, 20))
        story.append(GoldDivider(self.content_width * 0.4, "ornate"))
        story.append(Spacer(1, 20))
        
        story.append(Paragraph("Prognose 2025", self.styles['SectionHeader']))
        
        if self.analysis.current_year_theme:
            story.append(Paragraph(f"<b>Jahresenergie:</b> {self.analysis.current_year_theme}", self.styles['AstroBody']))
        
        if self.analysis.current_year_prognosis:
            story.append(Paragraph(self.analysis.current_year_prognosis, self.styles['AstroBody']))
        
        if self.analysis.cycles:
            story.append(Paragraph("<b>Lebenskapitel:</b>", self.styles['SubsectionHeader']))
            
            cycle_data = [["Zeitraum", "Thema", "Entwicklung"]]
            for cycle in self.analysis.cycles:
                cycle_data.append([cycle.period, cycle.theme, cycle.development])
            
            table = Table(cycle_data, colWidths=[100, 150, 190])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), Theme.GOLD_MUTED),
                ('TEXTCOLOR', (0, 0), (-1, 0), Theme.BG_PAPER),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BACKGROUND', (0, 1), (-1, -1), Theme.BG_CREAM),
                ('GRID', (0, 0), (-1, -1), 0.5, Theme.GOLD_MUTED),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ]))
            story.append(Spacer(1, 10))
            story.append(table)
        
        return story

    def _closing(self) -> List:
        story = []
        story.append(Paragraph("Nächste Schritte", self.styles['SectionHeader']))
        
        next_steps = (
            "Diese Auswertung dient der <b>Selbstreflexion, Beziehungspflege und Potenzialorientierung</b>. "
            "<br/><br/>"
            "<b>Fokussieren Sie auf:</b><br/>"
            "1. Wiederkehrende Kommunikationsmuster bewusst wahrnehmen<br/>"
            "2. Strukturelle Balance durch bewusste Rituale stärken<br/>"
            "3. Die gemeinsame Wachstumsenergie für Projekte nutzen"
        )
        story.append(Paragraph(next_steps, self.styles['AstroBody']))
        
        story.append(Spacer(1, 30))
        story.append(GoldDivider(self.content_width, "ornate"))
        story.append(Spacer(1, 30))
        
        quote = "Wenn Metall das Wasser fuehrt und Holz in der Erde wurzelt, wird Liebe zu Bewusstheit."
        story.append(Paragraph(quote, self.styles['AstroQuote']))
        
        story.append(Spacer(1, 40))
        
        contact = "<b>www.astromirror.de</b><br/>beratung@astromirror.de"
        story.append(Paragraph(contact, self.styles['AstroBody']))
        
        story.append(Spacer(1, 30))
        
        disclaimer = (
            "<b>Disclaimer:</b> Diese Analyse dient der Selbstreflexion, dem Potenzial-Management "
            "und der strategischen Planung. Sie ist ein Werkzeug zur Stärkung Ihrer Selbstwahrnehmung "
            "und ersetzt keine medizinische, psychologische oder finanzielle Fachberatung."
        )
        story.append(Paragraph(disclaimer, self.styles['Disclaimer']))
        
        story.append(Spacer(1, 20))
        footer = f"AstroMirror Analytics / Erstellt am {datetime.now().strftime('%d.%m.%Y')}"
        story.append(Paragraph(footer, self.styles['AstroSmall']))
        
        return story


# ═══════════════════════════════════════════════════════════════════════════════
# SAMPLE DATA
# ═══════════════════════════════════════════════════════════════════════════════

def create_ben_zoe_analysis() -> PartnershipAnalysis:
    ben = Person(
        name="Ben",
        birth_date="24. Juni 1980",
        birth_place="Hannover",
        birth_time="15:20 Uhr",
        day_element="Yang-Holz",
        day_element_symbol="",
        chinese_animal="Affe",
        chinese_element="Metall",
        western_sun="Krebs",
        western_ascendant="Skorpion",
        archetype_title="Der Baum im Spiegel des Wassers",
        archetype_description=(
            "Wachstum, Authentizität, Wahrheitssuche - Ben verkörpert die Qualität des Yang-Holzes: "
            "aufstrebend, flexibel, mit tiefen Wurzeln. Die emotionale Tiefe des Krebses verbindet "
            "sich mit der entschlossenen Transformation des Skorpion-Aszendenten. Der Metall-Affe "
            "verleiht geistige Schärfe und strategisches Denken."
        ),
        core_traits=["Transformation", "Emotionale Tiefe", "Strategisches Denken", "Authentizität", "Wachstum"],
        pillars={"Jahr": "Metall-Affe", "Monat": "Wasser-Pferd", "Tag": "Yang-Holz", "Stunde": "Erde-Hund"}
    )
    
    zoe = Person(
        name="Zoe",
        birth_date="4. März 1990",
        birth_place="Bergisch Gladbach",
        birth_time="20:01 Uhr",
        day_element="Yang-Erde",
        day_element_symbol="",
        chinese_animal="Pferd",
        chinese_element="Metall",
        western_sun="Fische",
        western_ascendant="Waage",
        archetype_title="Der Berg unter dem wandernden Himmel",
        archetype_description=(
            "Ruhe, Standhaftigkeit, Ausgleich - Zoe trägt die Qualität der Yang-Erde: stabil wie "
            "ein Berg, nährend und zentrierend. Die emotionale Offenheit der Fische harmoniert mit "
            "der diplomatischen Ausrichtung des Waage-Aszendenten. Das Metall-Pferd bringt "
            "Freiheitsliebe und kreative Bewegung."
        ),
        core_traits=["Stabilität", "Diplomatie", "Freiheitsliebe", "Intuition", "Kreativität"],
        pillars={"Jahr": "Metall-Pferd", "Monat": "Erde-Tiger", "Tag": "Yang-Erde", "Stunde": "Wasser-Schwein"}
    )
    
    element_balance = ElementBalance(wood=35, fire=15, earth=25, metal=30, water=40)
    
    dynamics = PartnershipDynamic(
        attraction_type="Wasser-Holz-Verschmelzung - tiefe emotionale Resonanz, die in gemeinsames Wachstum mündet",
        tension_field="Yang-Holz (Ben) vs Metall-Energie (beide Jahre) - Reibung, geistige Spannung",
        growth_axis="Transformation durch Begegnung - Pluto-Weg durch Partnerschaften",
        mediator_element="Erde",
        key_strengths=[
            "Tiefe intuitive Verbindung durch dominante Wasser-Energie",
            "Analytische Klarheit und klare Kommunikation nach Konflikten (Metall)",
            "Komplementäre Archetypen: Wachstum (Holz) trifft Stabilität (Erde)",
            "Gemeinsame Metall-Jahre: mentale Schärfe und strategisches Denken"
        ],
        key_challenges=[
            "Überstrukturierung kann zu emotionaler Kälte führen",
            "Wasser-Überflutung birgt Erschöpfungsgefahr",
            "Freiheitsdrang (Pferd) vs. Verbundenheit (Krebs) erfordert Balance",
            "Transformation durch Konflikte statt Vermeidung"
        ]
    )
    
    cycles = [
        LifeCycle("2010-2020", "Aufbauphase", "Leidenschaft, intensive Prägung"),
        LifeCycle("2020-2030", "Konsolidierung", "Bewusste Kommunikation, Regulation"),
        LifeCycle("2030-2040", "Reifung", "Integration von Nähe und Freiheit"),
    ]
    
    return PartnershipAnalysis(
        person_a=ben,
        person_b=zoe,
        element_balance=element_balance,
        dynamics=dynamics,
        cycles=cycles,
        current_year_theme="Jahr der Holz-Schlange",
        current_year_prognosis=(
            "2025 wird ein Jahr des aktiven Gleichgewichts. Holz stärkt Wasser - tiefere "
            "emotionale Verbindung und kreative Zusammenarbeit werden begünstigt. Die steigende "
            "Feuer-Energie bringt jedoch erhöhte Reizbarkeit bei Überlastung. Empfehlung: "
            "Pflege der Erd-Rituale - Ruhe, Struktur, bewusste Abgrenzung."
        ),
        strategy_career="Kombinieren Sie Bens analytische Schärfe mit Zoes diplomatischer Intuition. Geeignete Felder: Beratung, kreative Technologien, systemische Arbeit.",
        strategy_behavior="Pflegen Sie Zoes diplomatische Sprache zusammen mit Bens ehrlicher Tiefe. Das Ziel: Direkte Wahrheit in sanfter Form.",
        strategy_environment="Suchen Sie Räume mit Wasser- oder Holzqualität - Natur, Bewegung, fliessende Musik. Sie nähren Ihre gemeinsame Resonanz.",
        strategy_health="Erdung und Schlaf sind Ihr gemeinsamer Regenerationsanker. Achten Sie auf das Verdauungssystem. Vermeiden Sie Dauerstimulation."
    )


if __name__ == "__main__":
    analysis = create_ben_zoe_analysis()
    output = "/home/claude/AstroMirror_Partnership_Analysis.pdf"
    generator = AstroMirrorPDF(analysis, output)
    result = generator.generate()
    print(f"PDF erstellt: {result}")
