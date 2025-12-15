
import { School, WikiArticle, WikiCategory, OnboardingTask } from './types';

export const INITIAL_SCHOOLS: School[] = [
  {
    id: '1',
    name: 'University of Washington',
    location: 'Seattle, WA',
    country: 'USA',
    type: 'Graduate School',
    programs: ['Computer Science', 'Data Science', 'Business'],
    tuitionRange: '$40,000 - $55,000',
    requirements: {
      gpa: '3.5+',
      toefl: '92+',
      ielts: '7.0',
    },
    tags: ['STEM', 'Public Ivy', 'Research'],
    description: 'The University of Washington is a public research university in Seattle, Washington. Founded in 1861, Washington is one of the oldest universities on the West Coast.',
    isPartner: false,
    updatedAt: '2023-10-25'
  },
  {
    id: '2',
    name: 'University of Toronto',
    location: 'Toronto, ON',
    country: 'Canada',
    type: 'University',
    programs: ['Engineering', 'Finance', 'Life Sciences'],
    tuitionRange: 'CAD 60,000+',
    requirements: {
      gpa: '3.7+',
      ielts: '7.0',
    },
    tags: ['Top 30 Global', 'Urban Campus', 'Co-op Available'],
    description: 'The University of Toronto is a public research university in Toronto, Ontario, Canada, located on the grounds that surround Queen\'s Park.',
    isPartner: false,
    updatedAt: '2023-11-01'
  },
  {
    id: '3',
    name: 'Amerigo Education - Los Angeles',
    location: 'Los Angeles, CA',
    country: 'USA',
    type: 'High School',
    programs: ['High School Diploma', 'AP Courses'],
    tuitionRange: '$65,000 (Boarding)',
    requirements: {
      toefl: '60+',
    },
    tags: ['Boarding', 'University Track', 'Partner'],
    description: 'Amerigo Los Angeles offers international students a path to the best universities in the USA through a supportive, boarding-style environment.',
    isPartner: true,
    updatedAt: '2023-09-15'
  }
];

export const INITIAL_WIKI_ARTICLES: WikiArticle[] = [
  {
    id: 'w1',
    title: '美國研究所申請流程總覽',
    category: WikiCategory.PROCESS,
    content: `
### 申請時間軸 (以秋季入學為例)

1. **大三下 (1-6月)**: 
   - 確定目標學校名單 (Shortlist)
   - 準備標準化考試 (GRE/GMAT/TOEFL/IELTS)
   - 尋找推薦人

2. **暑假 (7-8月)**:
   - 開始撰寫 SOP (讀書計畫) 與 CV (履歷)
   - 實習或相關科研經歷收尾

3. **大四上 (9-11月)**:
   - 完成線上網申 (Online Application)
   - 送出推薦信邀請
   - 寄送官方成績單

4. **大四上/下 (12-2月)**:
   - 確認所有文件齊全 (Status Check)
   - 準備面試 (部分商科或博班)

5. **大四下 (3-4月)**:
   - 收到錄取通知 (Offer)
   - 繳交訂金 (Deposit)
   - 申請 I-20 與簽證
    `,
    tags: ['USA', 'Master', 'Process'],
    lastModified: '2023-10-01'
  },
  {
    id: 'w2',
    title: 'STEM 專業定義與 OPT 延伸',
    category: WikiCategory.GLOSSARY,
    content: `
### 什麼是 STEM?
STEM 代表 **Science, Technology, Engineering, and Mathematics**。
美國國土安全部 (DHS) 指定了一系列屬於 STEM 領域的學位課程。

### STEM OPT 優勢
一般 F-1 學生畢業後享有 12 個月的 OPT (Optional Practical Training) 工作實習期。
若畢業於 STEM 指定科系 (CIP Code 符合)，可申請 **24 個月的延期 (STEM Extension)**，總計享有 **36 個月 (3年)** 的合法工作時間。

**話術重點**: 推薦重視在美就業的理工科或數據分析類商科學生優先選擇 STEM 項目。
    `,
    tags: ['STEM', 'Visa', 'Work Permit', 'USA'],
    lastModified: '2023-08-20'
  },
  {
    id: 'w3',
    title: '如何回答「為什麼代辦費比別家貴？」',
    category: WikiCategory.SALES,
    content: `
### 應對策略

1. **強調「客製化」而非「模板化」**:
   - *「我們不使用公版 SOP。每位顧問只接限量學生，確保能花 20 小時以上與您深度訪談，挖掘獨特亮點。」*

2. **強調「後續服務」**:
   - *「很多機構拿到 Offer 就結束了，但我們包含簽證輔導、行前說明會、甚至當地的校友網絡對接。出國後的安心感是無價的。」*

3. **強調「資訊透明」**:
   - *「我們的系統讓您隨時看到申請進度（展示 EduConnect 系統），所有帳號密碼都會與您共享，資訊完全對稱。」*
    `,
    tags: ['Sales', 'Objection Handling', 'Price'],
    lastModified: '2023-11-10'
  },
  {
    id: 'w4',
    title: 'Shorelight Education 2024 合作重點整理',
    category: WikiCategory.PARTNER,
    content: `
### 廠商簡介
Shorelight 專門與美國一線大學合作，提供國際大一 (International Year One) 與碩士橋樑課程 (Pre-Master)。

### 重點推薦學校
- **University of Utah (Utah)**: 遊戲設計、商科強項。
- **American University (DC)**: 國際關係、公共事務全美頂尖。
- **Auburn University (Alabama)**: 供應鏈管理、工程強項。

### 申請注意事項
1. **免 SAT/GRE**: 透過 Shorelight 管道申請，大部份科系可免除 GRE/GMAT。
2. **內測機制**: 學生若無托福成績，可預約 iTEP 內測。
3. **獎學金**: 針對 GPA 3.0+ 學生，通常有 $3,000 - $10,000 不等的入學獎學金，請務必主動爭取。

**聯絡窗口**: 
- Jessica Lin (Regional Manager)
- Email: jessica.lin@shorelight.com
    `,
    tags: ['Partner', 'USA', 'Pathway'],
    lastModified: '2023-11-15'
  }
];

export const CATEGORY_LABELS: Record<WikiCategory, string> = {
  [WikiCategory.PROCESS]: '申請流程指南',
  [WikiCategory.FAQ]: '常見 Q&A',
  [WikiCategory.GLOSSARY]: '專有名詞辭典',
  [WikiCategory.SALES]: '銷售與溝通話術',
  [WikiCategory.CONTRACT]: '合約與行政規範',
  [WikiCategory.PARTNER]: '合作廠商資訊'
};

export const INITIAL_ONBOARDING_DATA: OnboardingTask[] = [
  {
    id: 'day1',
    day: 1,
    title: '公司文化與基本工具設定',
    description: `
**歡迎加入 EduConnect！** 第一天請放輕鬆，熟悉環境。

- [ ] 領取員工電腦與識別證
- [ ] 設定公司 Email (Outlook) 與簽名檔
- [ ] 加入 Slack 群組：#general, #announcements, #admissions
- [ ] 閱讀 [Wiki: 合約與行政規範] 了解請假流程
- [ ] 自我介紹 (在 Slack #general 頻道)
    `
  },
  {
    id: 'day2',
    day: 2,
    title: '留學產業基礎知識 (美加篇)',
    description: `
今天重點在於建立對北美學制的基礎認知。

- [ ] 閱讀 [Wiki: 美國研究所申請流程總覽]
- [ ] 了解什麼是 "Conditional Offer" 與 "Direct Entry"
- [ ] 學習操作 EduConnect 系統查詢 [合作院校資料庫]
- [ ] 測試：試著找出一間提供 STEM 商科的美國大學
    `
  },
  {
    id: 'day3',
    day: 3,
    title: '英澳學制與 ATAS/CAS',
    description: `
英國與澳洲的申請邏輯與美國不同，請特別留意。

- [ ] 了解英國申請系統 UCAS
- [ ] 學習名詞：CAS (Confirmation of Acceptance for Studies)
- [ ] 學習名詞：ATAS (理工科審查)
- [ ] 觀看資深顧問 John 的諮詢錄影 (檔案在共用硬碟 /Training/Video 03)
    `
  }
];
