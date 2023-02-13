import { AlignmentType, FrameAnchorType, HeadingLevel, HeightRule, HorizontalPositionAlign, HorizontalPositionRelativeFrom, IIndentAttributesProperties, ImageRun, IParagraphOptions, ITableCellOptions, LineRuleType, Paragraph, Table, TableCell, TableRow, TextDirection, TextRun, TextWrappingType, VerticalAlign, VerticalPositionAlign, VerticalPositionRelativeFrom, WidthType } from "docx";
import { ITableCellMarginOptions } from "docx/build/file/table/table-properties/table-cell-margin";

export enum Font {
    fangsong = '仿宋',
    yahei = '微软雅黑',
    kaiti = '楷体',
    heiti = '黑体',
    songti = '宋体',

    red = 'ff0000',
    pink = 'ff69b4',
    black = '000000',
    white = 'ffffff',
    darkblue = '00008b',
    lightblue = '87CEFA',

    one = '26pt',
    two = '22pt',
    two_2 = '18pt',
    three = '16pt',
    three_2 = '15pt',
    four = '14pt',
    four_2 = '12pt',
    five = '10.5pt',
    five_2 = '9pt'
}

export const firstLine={firstLine:'1.5cm'}

/**
 * docx 中的主要对象
 * 
 * 1、Paragraph相当于段落，段落中可包含图片，文字，
 * 文字textrun，textRun不能脱离paragraph,文字有内容，字体等样式。图片imageRun，图片主要是大小和布局
 * 2、table、tableRow、tableCell,表格的三个部分，
 * table由row组成，row有高度，没有宽度，宽度是所有cell宽度的和，
 * row由cell组成，cell没有高度，高度就是row的高度
 */
export class DocCreate {
    constructor() { }
    public createPishiText(content: string): Paragraph {
        let op: IParagraphOptions = {
            children: [
                new TextRun({
                    size: Font.three,
                    text: content,
                    font: Font.fangsong
                })
            ],
            alignment: AlignmentType.CENTER
        };
        return new Paragraph(op);
    }

    public createTextFrame(text: TextRun, x: number, y: number, w: number, h: number) {
        return new Paragraph({
            frame: {
                position: {
                    x: x,
                    y: y
                },
                width: w,
                height: h,
                anchor: {
                    horizontal: FrameAnchorType.TEXT,
                    vertical: FrameAnchorType.TEXT,
                },
                alignment: {
                    x: HorizontalPositionAlign.CENTER,
                    y: VerticalPositionAlign.TOP,
                },
            },
            children: [text]
        })
    }

    /**
     * 创建表格
     * @param width 表格总宽度
     * @param rows 行数组
     * @returns 
     */
    public createTable(width: string | number, rows: TableRow[]) {
        return new Table({
            width: {
                size: width,
                type: WidthType.DXA
            },
            rows: rows
        })
    }

    /**
     * 创建行
     * @param height 行高
     * @param cells 单元格
     * @returns 
     */
    public createTableRow(height: string, cells: TableCell[]): TableRow {
        return new TableRow(
            {
                height: {
                    value: height,
                    rule: HeightRule.ATLEAST
                },
                children: cells
            }
        )
    }

    /**
     * 单元格
     * @param width 宽度
     * @param content 内容
     * @param margin 
     * @param align 对齐方式
     * @returns 
     */
    public createTableCell(width: string|number, content: Paragraph[], margin: ITableCellMarginOptions = {}, align: VerticalAlign = VerticalAlign.CENTER) {
        return new TableCell({
            width: {
                size: width,
                type: WidthType.DXA
            },
            children: content,
            verticalAlign: align,
            margins: margin
        })
    }

    /**
     * 通用段落创建
     * @param content 段落内容
     * @param align 对齐
     * @param indent 缩进
     * @param lineHeight 行高
     * @param heading 大纲级别
     * 顺序：文字，对齐方式，缩进，行高，大纲级别
     * @returns 
     */
    public createParagraph(content: TextRun[], align: AlignmentType = AlignmentType.JUSTIFIED, indent: IIndentAttributesProperties = {}, lineHight: number = 350, heading: HeadingLevel = HeadingLevel.TITLE) {
        return new Paragraph({
            alignment: align,
            children: content,
            indent: indent,
            //行间距
            spacing: {
                line: lineHight,
                lineRule: LineRuleType.AUTO
            },
            heading: heading
        })
    }

    /**
     * 创建文字
     * @param content 文字内容
     * @param size 字体大小
     * @param fontFamily 字体
     * @returns 
     * 顺序：内容，大小，颜色，字体，加粗
     */
    public createTextRun(
        content: string,
        size: string = Font.three,
        color: string = Font.black,
        fontFamily: string = Font.fangsong,
        bold: boolean = false
    ) {
        return new TextRun({
            text: content,
            size: size,
            font: fontFamily,
            color: color,
            bold: bold,
            italics:false,
        })
    }

    public createNullLine(): Paragraph {
        return new Paragraph({})
    }

    /**
     * 标题
     * @param content 
     * @returns 
     */
    public createTitle(content: string, fontSize: string = Font.two, color: string = Font.black, fontFamily: string = Font.heiti): Paragraph {
        return this.createParagraph([this.createTextRun(content, fontSize, color, fontFamily)], AlignmentType.CENTER, {}, 350, HeadingLevel.HEADING_1)
    }

    //二级标题
    public createTitle_2(content: string, fontSize: string = Font.three, color: string = Font.black, fontFamily: string = Font.fangsong): Paragraph {
        return this.createParagraph([this.createTextRun(content, fontSize, color, fontFamily,true)], AlignmentType.LEFT, firstLine, 350, HeadingLevel.HEADING_2)
    }

    //三级标题
    public createTitle_3(content: string, fontSize: string = Font.three, color: string = Font.black, fontFamily: string = Font.fangsong): Paragraph {
        return this.createParagraph([this.createTextRun(content, fontSize, color, fontFamily,true)], AlignmentType.LEFT, firstLine, 350, HeadingLevel.HEADING_3)
    }

    //四级标题
    public createTitle_4(content: string, fontSize: string = Font.three, color: string = Font.black, fontFamily: string = Font.fangsong): Paragraph {
        return this.createParagraph([this.createTextRun(content, fontSize, color, fontFamily, true)], AlignmentType.LEFT, firstLine, 350, HeadingLevel.HEADING_4)
    }

    //五级标题
    public createTitle_5(content: string, fontSize: string = Font.three, color: string = Font.black, fontFamily: string = Font.fangsong): Paragraph {
        return this.createParagraph([this.createTextRun(content, fontSize, color, fontFamily,false)], AlignmentType.LEFT, firstLine, 350, HeadingLevel.HEADING_5)
    }



    /**
     * 正文段落
     * @param content 段落内容
     * @returns 
     */
    public createMainText(content: string, color: string = Font.black, fontFamily: string = Font.fangsong,) {
        return this.createParagraph([this.createTextRun(content, Font.three, color, fontFamily,)], AlignmentType.JUSTIFIED, { firstLine: '1.5cm' })
    }

    public createMainText_bold(content: string, color: string = Font.black, fontFamily: string = Font.fangsong,) {
        return this.createParagraph([this.createTextRun(content, Font.three, color, fontFamily, true)], AlignmentType.JUSTIFIED, { firstLine: '1.5cm' })
    }


    public createImage(buffer: ArrayBuffer) {
        return new ImageRun({
            data: buffer,
            transformation: {
                width: 90,
                height: 120,
            },
            floating: {
                horizontalPosition: {
                    // offset: 1014400*2, // relative: HorizontalPositionRelativeFrom.PAGE by default
                    //右对齐，页边距
                    align: HorizontalPositionAlign.RIGHT,
                    relative: HorizontalPositionRelativeFrom.COLUMN
                },
                verticalPosition: {
                    // offset: 1014400, // relative: VerticalPositionRelativeFrom.PAGE by default
                    //顶端对齐，行
                    align: VerticalPositionAlign.TOP,
                    relative: VerticalPositionRelativeFrom.LINE
                },
                //四周环绕
                wrap: {
                    type: TextWrappingType.SQUARE
                }
            },
        });
    }



}