from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


OUTPUT_PATH = Path("output/pdf/synthetic-supplier-catalogue.pdf")


def main() -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    styles = getSampleStyleSheet()
    document = SimpleDocTemplate(
        str(OUTPUT_PATH),
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title="Kasi Wholesale Synthetic Catalogue",
        author="KasiStock AI validation fixture",
    )

    story = [
        Paragraph("KASI WHOLESALE - SYNTHETIC QA CATALOGUE", styles["Title"]),
        Spacer(1, 4 * mm),
        Paragraph("Catalogue date: 20 July 2026", styles["Heading2"]),
        Paragraph(
            "Fictional evidence fixture for live extraction validation. Not a real offer.",
            styles["BodyText"],
        ),
        Spacer(1, 8 * mm),
    ]

    rows = [
        ["Supplier item", "Pack", "Case quantity", "Case price", "Unit price"],
        ["Kasi Maize Meal 1kg", "1 kg bag", "10", "R 180.00", "R 18.00"],
        ["Kasi Baked Beans 410g", "410 g can", "12", "R 156.00", "R 13.00"],
        ["Kasi Sunflower Oil 750ml", "750 ml bottle", "6", "R 228.00", "R 38.00"],
    ]
    table = Table(rows, colWidths=[58 * mm, 32 * mm, 30 * mm, 30 * mm, 28 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#173D32")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("ALIGN", (2, 1), (-1, -1), "RIGHT"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F2F6F4")]),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#9AA9A3")),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(table)
    story.append(Spacer(1, 8 * mm))
    story.append(
        Paragraph(
            "Prices include VAT. Offers are valid only for this synthetic QA document.",
            styles["BodyText"],
        )
    )
    document.build(story)
    print(OUTPUT_PATH)


if __name__ == "__main__":
    main()
