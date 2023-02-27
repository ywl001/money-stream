import { Store } from "@ngrx/store";
import { AlignmentType, Document, VerticalAlign } from "docx";
import { AppInjector } from "../app-injector";
import { AccountInfo, Lawcase, Person, TradeRecord } from "../app-state/types";
import { DocCreate as DocCreator, firstLine, Font } from "./docCreator";

export class ReportCreate {

    private mainCase: Lawcase
    private docCreator: DocCreator;
    private sub: string = '孟公情指[2023]009号';

    docData: any[] = []

    constructor(lawCase: Lawcase) {
        this.mainCase = lawCase;
        this.docCreator = new DocCreator();
        const store = AppInjector.getInjector().get(Store)

        // store.select(selector_user).pipe(
        //     map((user:User)=>user.realName)
        // ).subscribe(uname=>{
        //     this.createDoc(uname)
        // })
        // this.createDoc('王洁琼')

        this.createDoc();
    }

    private createDoc() {
        this.docData = [
            this.docCreator.createParagraph([this.docCreator.createTextRun('内部资料，注意保密', '14pt')]),
            this.docCreator.createTable(9070, [
                this.docCreator.createTableRow('4cm', [
                    this.docCreator.createTableCell(1200, [
                        this.docCreator.createParagraph([this.docCreator.createTextRun('领', '16pt'),], AlignmentType.CENTER,),
                        this.docCreator.createParagraph([this.docCreator.createTextRun('导', '16pt'),], AlignmentType.CENTER),
                        this.docCreator.createParagraph([this.docCreator.createTextRun('批', '16pt'),], AlignmentType.CENTER),
                        this.docCreator.createParagraph([this.docCreator.createTextRun('示', '16pt'),], AlignmentType.CENTER,),
                    ], { top: 300 }),
                    this.docCreator.createTableCell(7750,
                        [this.docCreator.createParagraph([this.docCreator.createTextRun('年   月   日', '16pt')], AlignmentType.RIGHT)], { right: 300, bottom: 200 },
                        VerticalAlign.BOTTOM)
                ]),

                this.docCreator.createTableRow('4cm', [
                    this.docCreator.createTableCell('2.26cm', [
                        this.docCreator.createParagraph([this.docCreator.createTextRun('部', '16pt'),], AlignmentType.CENTER),
                        this.docCreator.createParagraph([this.docCreator.createTextRun('门', '16pt'),], AlignmentType.CENTER),
                        this.docCreator.createParagraph([this.docCreator.createTextRun('审', '16pt'),], AlignmentType.CENTER),
                        this.docCreator.createParagraph([this.docCreator.createTextRun('核', '16pt'),], AlignmentType.CENTER),
                    ], { top: 300 }),
                    this.docCreator.createTableCell('14.12cm',
                        [this.docCreator.createParagraph([this.docCreator.createTextRun('年   月   日', '16pt')], AlignmentType.RIGHT)], { right: 300, bottom: 200 }, VerticalAlign.BOTTOM)
                ])]),

            this.docCreator.createNullLine(),
            this.docCreator.createNullLine(),
            this.docCreator.createTitle(`${this.mainCase.caseName}研判报告`),
            this.docCreator.createParagraph([this.docCreator.createTextRun(this.sub, Font.four)], AlignmentType.RIGHT, { right: '2cm' }),
            this.docCreator.createNullLine(),
            this.docCreator.createNullLine(),
            this.docCreator.createTitle_2(`${this.getTitleNumber()}、案件基本情况`),
            this.docCreator.createMainText(this.mainCase?.caseContent!),

        ]

        if (this.mainCase.personMap.get('daji').length > 0) {
            this.docData.push(this.docCreator.createTitle_2(this.getTitleNumber() + '、可打击人员'));
            let daji = this.mainCase.personMap.get('daji');
            for (let i = 0; i < daji.length; i++) {
                const p = daji[i];
                this.createPersonData(p, i)
            }
        }

        if (this.mainCase.personMap.get('luodi').length > 0) {
            this.docData.push(this.docCreator.createTitle_2(this.getTitleNumber() + '、需核查人员'));
            let luodi = this.mainCase.personMap.get('luodi');
            for (let i = 0; i < luodi.length; i++) {
                const p = luodi[i];
                this.createPersonData(p, i)
            }
        }


        if (this.mainCase.personMap.get('other').length > 0) {
            this.docData.push(this.docCreator.createTitle_2(this.getTitleNumber() + '、其他可打击人员'));
            let other = this.mainCase.personMap.get('other');
            for (let i = 0; i < other.length; i++) {
                const p = other[i];
                this.createPersonData(p, i)
            }
        }

        this.docData.push(this.docCreator.createTitle_2(`${this.getTitleNumber()}、打击处理情况：`));

        const whitePerson = this.getNoQianke();
        let qianke = '经我局研判，截至目前，';
        whitePerson.forEach(p => {
            qianke += p.name + '、'
        })
        qianke = qianke.substring(0, qianke.length - 1);
        qianke += '尚未被其他公安机关打击处理。';

        const blackPerson = this.getHasQianke();
        blackPerson.forEach(p => {
            qianke += p.name + '，' + p.criminalRecord + '，'
        })

        qianke = qianke.substring(0, qianke.length - 1);
        qianke = this.checkJuhao(qianke)

        this.docData.push(this.docCreator.createMainText(qianke));

        this.docData.push(this.docCreator.createTitle_2(`${this.getTitleNumber()}、研判结果：`))

        if (this.mainCase.relationPersons.length > 0) {
            let str = '1、';
            let criminalTypeMap: Map<string, Array<string>> = new Map();
            for (let i = 0; i < this.mainCase.relationPersons.length; i++) {
                const p = this.mainCase.relationPersons[i];
                const key = p.sue;
                if (criminalTypeMap.has(key)) {
                    criminalTypeMap.get(key).push(p.name)
                } else {
                    criminalTypeMap.set(key, [p.name])
                }
            }

            criminalTypeMap.forEach((value, key) => {
                value.forEach(pname => {
                    str += pname + '、';
                })
                str = str.substring(0, str.length - 1)
                str += `涉嫌${key}，`
            })
            str += '建议办案单位落地核查并打击。'

            // str+=`犯罪嫌疑人${p.name}`
            this.docData.push(this.docCreator.createMainText(str));
        }
        this.docData.push(this.docCreator.createMainText('2、办案单位采取工作措施及工作情况随时报反诈中心。'));

        this.docData.push(this.docCreator.createNullLine());
        this.docData.push(this.docCreator.createNullLine());
        this.docData.push(this.docCreator.createNullLine());
        this.docData.push(this.docCreator.createNullLine());

        //最后的落款
        this.docData.push(this.docCreator.createParagraph([this.docCreator.createTextRun(`反诈中心研判人： ${this.mainCase.reportCreator}`)], AlignmentType.RIGHT, { right: '3cm' }))
        this.docData.push(this.docCreator.createParagraph([this.docCreator.createTextRun(`${new Date().toLocaleString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}`)], AlignmentType.RIGHT, { right: '3cm' }))

    }

    //创建人员
    private createPersonData(p: Person, i: number) {
        this.docData.push(this.docCreator.createTitle_3(`${i + 1}、${p.name}`))
        let info = this.checkJuhao(this.personToString(p));
        info += `该${p.name}名下共有${p.relationAccounts.length}张银行卡涉案：`
        let renyuan;
        if (p.photo && p.photo.byteLength > 100) {
            renyuan = this.docCreator.createParagraph(
                [this.docCreator.createImage(p.photo), this.docCreator.createTextRun(info)],
                AlignmentType.LEFT,
                firstLine)
        } else {
            renyuan = this.docCreator.createMainText(info)
        }

        this.docData.push(renyuan);
        for (let i = 0; i < p.relationAccounts.length; i++) {
            const item = p.relationAccounts[i];
            const isDuigong = item.isDuigong == 1 ? '对公账户：' : ''
            const fistLine = this.docCreator.createTitle_4(`(${i + 1})，${isDuigong} ${item.account}，流水${item.liushuiCount}`);
            this.docData.push(fistLine);
            const account_str = this.accountToString(p, item);
            // const accountInfo_str = this.docCreator.createParagraph(
            //     [this.docCreator.createTextRun(account_str), this.docCreator.createTextRun(this.checkJuhao(item.remark), Font.three, Font.black, Font.fangsong,)], AlignmentType.LEFT, firstLine
            // );

            this.docData.push(this.docCreator.createMainText(this.checkJuhao(account_str)));

            //对账号remark分段
            if (item.remark && item.remark.length > 5) {
                const arr = this.fenduan(item.remark);
                for (let i = 0; i < arr.length; i++) {
                    const item = arr[i];
                    this.docData.push(this.docCreator.createMainText(this.checkJuhao(item)));
                }
            }

            const cashInfo = this.getCashInfo(item.cashRecords);
            if (cashInfo != '') {
                this.docData.push(this.docCreator.createMainText(cashInfo));
            }

            // this.docData.push(this.docCreator.createMainText(item.remark,'f00f00'))
            // console.log(item.relationLawcases)
            if (item.relationLawcases?.length > 0) {
                this.docData.push(this.docCreator.createMainText('涉及案件：'))
                let lawcaseMap: Map<string, Lawcase> = new Map();
                // let lawcaseMap:Map<string,Lawcase[]> = new Map();
                for (let j = 0; j < item.relationLawcases.length; j++) {
                    const lc = item.relationLawcases[j];

                    lawcaseMap.set(lc.caseNumber, lc)
                }

                lawcaseMap.forEach(lc => {
                    console.log(lc)
                    if (lc.caseNumber?.charAt(0) == 'B' && lc.caseContent) {
                        this.docData.push(this.docCreator.createTitle_5(`${lc.caseNumber}--${lc.caseName}，${lc.caseContent}`))
                    } else
                        this.docData.push(this.docCreator.createTitle_5(`${lc.caseNumber}--${lc.caseName}`))
                })
            }
        }
    }

    private personToString(p: Person) {
        let str = `${p.name}，${p.personNumber}。`
        const birthday = `出生日期：${p.personNumber.substring(6, 10)}年${p.personNumber.substring(10, 12)}月${p.personNumber.substring(12, 14)}日，`
        const gender = p.gender ? `性别:${p.gender}，` : '';
        const nation = p.nation ? `民族:${p.nation}，` : '';
        const marriage = p.marriage ? `婚姻状况:${p.marriage}，` : '';
        const address = p.address ? `户籍地：${p.address}。` : '';
        const tel = p.phoneNumber ? `联系手机：${p.phoneNumber}，` : '';
        const remark = p.remark ? p.remark : '';

        let duigong = '';
        if (p.isLawPerson == 1) {
            duigong = `${p.name}为对公账户`;
            p.relationAccounts.forEach(a => {
                if (a.isDuigong == 1) {
                    console.log('account is duigong:' + a.account)
                    duigong += a.account + '的法人代表。公司名称：' + a.gongsi + '。';
                }
            })
        }
        return `${p.name}，${p.personNumber}。${tel}${gender}${nation}${birthday}${marriage}${address}${duigong}${remark}`
    }

    // private accountToString(p:Person,a:AccountInfo){

    //     const address = p.address ? `户籍地：${p.address}，`: '';
    //     const tel = p.phoneNumber ? `联系手机：${p.phoneNumber}，`: '';
    //     const company = a.company ? `开户网点：${a.company}。`: '';
    //     const createDate = a.createDate ? `开户日期：${a.createDate}。`: '';
    //     let pp = `证照号码：${p.personNumber}，主体名称：${p.name}，${address}`;
    //     let aa = company + createDate
    //     return this.checkJuhao(pp+aa);
    // }

    private accountToString(p: Person, a: AccountInfo) {

        const address = p.address ? `户籍地：${p.address}，` : '';
        const tel = p.phoneNumber ? `联系手机：${p.phoneNumber}，` : '';
        const company = a.company ? `开户网点：${a.company}。` : '';
        const createDate = a.createDate ? `开户日期：${a.createDate}。` : '';
        let pp = `证照号码：${p.personNumber}，主体名称：${p.name}，${address}`;
        let aa = company + createDate;

        if (a.isDuigong == 1) {
            return this.delBlankChar(`对公帐户${a.account}开户信息：
            ${this.getValue(a.zhengzhao, '证照号码：')}
            ${this.getValue(a.gongsi, '主体名称：')}
            ${this.getValue(p.phoneNumber, ' 联系手机：')}
            ${this.getValue(a.gongsiDizhi, '单位地址：')}
            ${this.getValue(p.name, '法人代表：')}
            ${this.getValue(p.personNumber, '法人代表证件号码：')}
            ${this.getValue(a.gongshang, '客户原工商注册号码：')}
            ${this.getValue(a.guoshui, '国税纳税号：')}
            ${this.getValue(a.dishui, '地税纳税号：')}
            ${this.getValue(a.company, '开户行：')}
            ${this.getValue(a.createDate, '开户日期：')}

           `)
        } else {
            return this.checkJuhao(pp + aa);
        }
    }

    private getValue(a: string | boolean, b: string) {
        if (a) {
            return b + a + '，';
        }
        return '';
    }

    private delBlankChar(str: string) {
        if (typeof str === 'string')
            return str.replace(/\s*/g, "");
        return str;
    }

    private checkJuhao(str: string) {
        if (str) {
            str = str.trim();
            if (str.charAt(str.length - 1) == '。' || str == '' || str == '：' || str==':') {
                return str;
            }
            if (str.charAt(str.length - 1) == '，' || str.charAt(str.length - 1) == ',' || str.charAt(str.length - 1) == '　') {
                return str.substring(0, str.length - 1) + '。';
            }
            return str + '。'
        }
    }

    private isHasCriminnalRecord(persons: Person[]) {
        for (let i = 0; i < persons.length; i++) {
            const element = persons[i];
            if (element.criminalRecord && element.criminalRecord.length > 1) {
                return true;
            }
        }
        return false;
    }

    private getCashInfo(records: TradeRecord[]) {
        if (records.length == 0)
            return ''

        let dateMap = new Map();
        let positionMap = new Map();
        let totalCash = 0;
        records.forEach(r => {
            totalCash += parseInt(r.money + '');
            dateMap.set(r.tradeTime.substring(0, 11), '');
            // dateMap.set(r.tradeTime, '');
            positionMap.set(r.tradeBankName, '');
        })
        totalCash = Math.abs(totalCash)
        const cashTimes = records.length;
        let date_str = ''
        dateMap.forEach((v, k) => {
            date_str += k + '、'
        })
        date_str = date_str.substring(0, date_str.length - 1);


        let position_str = ''
        positionMap.forEach((v, k) => {
            position_str += k + '、'
        })
        position_str = position_str.substring(0, position_str.length - 1);

        return `该卡在${date_str}在${position_str},共计${cashTimes}次取现${totalCash}元`
    }


    public getReportDoc() {
        return new Document({
            sections: [{
                children: this.docData
            }]
        });
    }

    private tn = ['一', '二', '三', '四', '五', '六', '七']
    private getTitleNumber() {
        return this.tn.shift();
    }

    private getNoQianke(): Person[] {
        var arr = [];
        this.mainCase.relationPersons.forEach(p => {
            if (!p.criminalRecord || p.criminalRecord == '') {
                arr.push(p)
            }
        })
        return arr;
    }

    private getHasQianke(): Person[] {
        var arr = [];
        this.mainCase.relationPersons.forEach(p => {
            if (p.criminalRecord || p.criminalRecord?.length > 0) {
                arr.push(p)
            }
        })
        return arr;
    }

    private fenduan(str) {
        return JSON.stringify(str).replace(/\"/g, '').split('\\n')
    }
}