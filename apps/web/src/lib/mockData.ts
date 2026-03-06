import { PassageResult } from "@gyoanmaker/shared/types";

export const MOCK_PASSAGE_RESULTS: PassageResult[] = [
  {
    passage_id: "P01",
    sentences: [
      {
        en: "The rapid advancement of artificial intelligence has transformed various industries, from healthcare to finance.",
        ko: "인공지능의 급격한 발전은 의료에서 금융에 이르기까지 다양한 산업을 변화시켰습니다."
      },
      {
        en: "However, this technological shift also raises significant ethical concerns regarding data privacy and algorithmic bias.",
        ko: "하지만 이러한 기술적 변화는 데이터 프라이버시와 알고리즘 편향에 관한 중대한 윤리적 우려를 불러일으키기도 합니다."
      }
    ],
    topic_sentence: {
      en: "Artificial intelligence brings both industrial transformation and ethical challenges.",
      ko: "인공지능은 산업적 변혁과 윤리적 과제를 동시에 가져옵니다."
    },
    summary: {
      en: [
        "AI is revolutionizing multiple sectors including healthcare and finance.",
        "Ethical issues like privacy and bias are becoming increasingly important."
      ],
      ko: [
        "AI는 의료와 금융을 포함한 여러 분야를 혁신하고 있습니다.",
        "프라이버시와 편향 같은 윤리적 문제가 점점 더 중요해지고 있습니다."
      ]
    },
    flow_4: [
      { label: "Introduction", text: "Overview of AI's impact on modern industries." },
      { label: "Benefits", text: "Efficiency gains in healthcare and financial services." },
      { label: "Challenges", text: "Emergence of ethical dilemmas and privacy risks." },
      { label: "Conclusion", text: "The need for balanced development between tech and ethics." }
    ],
    core_vocab: [
      {
        word: "advancement",
        meaning_ko: "발전",
        synonyms: [
          { word: "progress", meaning_ko: "진전", level: "B2" },
          { word: "improvement", meaning_ko: "개선", level: "B2" },
          { word: "breakthrough", meaning_ko: "획기적 발견", level: "C1" }
        ],
        antonyms: [
          { word: "decline", meaning_ko: "쇠퇴", level: "B2" },
          { word: "regression", meaning_ko: "퇴보", level: "C1" }
        ]
      },
      {
        word: "ethical",
        meaning_ko: "윤리적인",
        synonyms: [
          { word: "moral", meaning_ko: "도덕적인", level: "B2" },
          { word: "principled", meaning_ko: "원칙이 있는", level: "C1" },
          { word: "righteous", meaning_ko: "의로운", level: "C1" }
        ],
        antonyms: [
          { word: "unethical", meaning_ko: "비윤리적인", level: "B2" },
          { word: "immoral", meaning_ko: "부도덕한", level: "B2" }
        ]
      }
    ]
  },
  {
    passage_id: "P02",
    sentences: [
      {
        en: "Sustainable urban planning is essential for mitigating the adverse effects of climate change in densely populated cities.",
        ko: "지속 가능한 도시 계획은 인구 밀도가 높은 도시에서 기후 변화의 부정적인 영향을 완화하는 데 필수적입니다."
      },
      {
        en: "Green spaces and efficient public transport systems play a crucial role in reducing carbon footprints.",
        ko: "녹지 공간과 효율적인 대중교통 시스템은 탄소 발자국을 줄이는 데 중요한 역할을 합니다."
      }
    ],
    topic_sentence: {
      en: "Sustainable planning is key to combating climate change in urban environments.",
      ko: "지속 가능한 계획은 도시 환경에서 기후 변화에 대응하는 핵심입니다."
    },
    summary: {
      en: [
        "Urban areas need sustainable strategies to handle climate risks.",
        "Infrastructure like parks and transit are vital for sustainability."
      ],
      ko: [
        "도시 지역은 기후 리스크를 관리하기 위해 지속 가능한 전략이 필요합니다.",
        "공원과 교통 같은 인프라는 지속 가능성을 위해 필수적입니다."
      ]
    },
    flow_4: [
      { label: "Context", text: "The vulnerability of cities to climate change." },
      { label: "Strategy", text: "Implementing sustainable urban design principles." },
      { label: "Action", text: "Expanding green zones and public transportation." },
      { label: "Goal", text: "Achieving significant reduction in urban carbon emissions." }
    ],
    core_vocab: [
      {
        word: "mitigate",
        meaning_ko: "완화하다",
        synonyms: [
          { word: "alleviate", meaning_ko: "경감하다", level: "C1" },
          { word: "reduce", meaning_ko: "줄이다", level: "B2" },
          { word: "moderate", meaning_ko: "절제하다", level: "B2" }
        ],
        antonyms: [
          { word: "aggravate", meaning_ko: "악화시키다", level: "C1" },
          { word: "intensify", meaning_ko: "강화하다", level: "B2" }
        ]
      },
      {
        word: "essential",
        meaning_ko: "필수적인",
        synonyms: [
          { word: "crucial", meaning_ko: "중대한", level: "B2" },
          { word: "indispensable", meaning_ko: "없어서는 안 될", level: "C1" },
          { word: "vital", meaning_ko: "생명에 중요한", level: "B2" }
        ],
        antonyms: [
          { word: "optional", meaning_ko: "선택적인", level: "B2" },
          { word: "superfluous", meaning_ko: "불필요한", level: "C1" }
        ]
      }
    ]
  },
  {
    passage_id: "P03",
    sentences: [
      {
        en: "The psychological impact of social media on adolescents has become a major subject of academic research.",
        ko: "소셜 미디어가 청소년에게 미치는 심리적 영향은 학술 연구의 주요 주제가 되었습니다."
      },
      {
        en: "While it facilitates global connectivity, it can also contribute to increased anxiety and social isolation.",
        ko: "그것은 글로벌 연결성을 촉진하지만, 불안감 증가와 사회적 고립의 원인이 될 수도 있습니다."
      }
    ],
    topic_sentence: {
      en: "Social media influences adolescent mental health in complex ways.",
      ko: "소셜 미디어는 청소년의 정신 건강에 복잡한 방식으로 영향을 미칩니다."
    },
    summary: {
      en: [
        "Researchers are studying how social media affects young people's minds.",
        "The platforms offer connectivity but also pose risks like anxiety."
      ],
      ko: [
        "연구자들은 소셜 미디어가 청소년의 마음에 어떤 영향을 미치는지 연구하고 있습니다.",
        "플랫폼은 연결성을 제공하지만 불안과 같은 리스크도 제기합니다."
      ]
    },
    flow_4: [
      { label: "Observation", text: "Rising interest in social media's psychological effects." },
      { label: "Positive", text: "Enhanced ability to connect with others globally." },
      { label: "Negative", text: "Potential for mental health issues and isolation." },
      { label: "Synthesis", text: "The dual nature of digital social interaction." }
    ],
    core_vocab: [
      {
        word: "facilitate",
        meaning_ko: "촉진하다",
        synonyms: [
          { word: "enable", meaning_ko: "가능하게 하다", level: "B2" },
          { word: "assist", meaning_ko: "돕다", level: "B2" },
          { word: "expedite", meaning_ko: "신속히 처리하다", level: "C1" }
        ],
        antonyms: [
          { word: "hinder", meaning_ko: "방해하다", level: "C1" },
          { word: "impede", meaning_ko: "지연시키다", level: "C1" }
        ]
      },
      {
        word: "isolation",
        meaning_ko: "고립",
        synonyms: [
          { word: "solitude", meaning_ko: "고독", level: "B2" },
          { word: "seclusion", meaning_ko: "격리", level: "C1" },
          { word: "detachment", meaning_ko: "분리", level: "C1" }
        ],
        antonyms: [
          { word: "integration", meaning_ko: "통합", level: "B2" },
          { word: "inclusion", meaning_ko: "포함", level: "B2" }
        ]
      }
    ]
  }
];
