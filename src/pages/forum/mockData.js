// AI 论坛 Mock 数据
export const recommendedQuestions = [
  {
    id: 'q1',
    title: '如何向团队解释 AI 辅助编程的实际价值？',
    excerpt: '领导希望看到可量化的收益，但代码质量、开发体验这类收益很难用数字表达，有没有什么好的汇报思路？',
    tags: [
      { text: 'AI 协作', color: 'primary' },
      { text: '团队管理', color: 'muted' },
    ],
    views: 1200,
    answers: 34,
    createdAt: '2 小时前',
  },
  {
    id: 'q2',
    title: '本地运行大语言模型，最低需要什么配置？',
    excerpt: '想在家里搭一个私有的问答助手，主要做文档检索和代码补全，显卡和内存应该怎么选？',
    tags: [
      { text: 'LLM', color: 'primary' },
      { text: '硬件', color: 'muted' },
    ],
    views: 856,
    answers: 21,
    createdAt: '5 小时前',
  },
  {
    id: 'q3',
    title: '有哪些适合非技术人员的 AI 工具入门路径？',
    excerpt: '市场、运营同学想利用 AI 提升效率，但面对大量工具不知道从何学起，求推荐循序渐进的学习路线。',
    tags: [
      { text: '入门', color: 'success' },
      { text: '工具推荐', color: 'muted' },
    ],
    views: 623,
    answers: 18,
    createdAt: '昨天',
  },
  {
    id: 'q4',
    title: 'AI 生成代码的安全性审查清单应该包含哪些项？',
    excerpt: '把 AI 生成的代码直接合入生产总觉得有风险，除了常规 CR，还应该重点检查哪些安全问题？',
    tags: [
      { text: '安全', color: 'primary' },
      { text: '代码审查', color: 'muted' },
    ],
    views: 412,
    answers: 12,
    createdAt: '2 天前',
  },
  {
    id: 'q5',
    title: '怎样设计提示词才能让 AI 给出更有针对性的回答？',
    excerpt: '同样是向 AI 提问，有时候回答很泛，有时候却很精准。除了提供更多上下文，还有哪些技巧？',
    tags: [
      { text: 'Prompt', color: 'success' },
      { text: '技巧', color: 'muted' },
    ],
    views: 1500,
    answers: 56,
    createdAt: '3 天前',
  },
]

export const exploreQuestions = [
  {
    id: 'e1',
    title: '如何评价最新的 GPT-5 预览版在代码生成上的表现？',
    excerpt: '最近拿到了 GPT-5 的 preview 权限，测试了一周后发现长上下文里的逻辑一致性有明显提升，但复杂依赖注入场景还是会出现幻觉。大家有类似的体验吗？',
    tags: [
      { text: '大模型', color: 'primary' },
      { text: '编程辅助', color: 'muted' },
    ],
    views: 1248,
    answers: 36,
    likes: 89,
    createdAt: '2 小时前',
    hot: 95,
  },
  {
    id: 'e2',
    title: '本地运行 70B 模型，显存 24GB 够吗？',
    excerpt: '想在自己的工作站上部署一个 70B 参数的模型做离线推理，目前只有一张 RTX 4090。量化到 4bit 之后能不能跑起来？',
    tags: [
      { text: '模型部署', color: 'primary' },
      { text: '硬件', color: 'muted' },
    ],
    views: 3620,
    answers: 52,
    likes: 215,
    createdAt: '5 小时前',
    hot: 120,
  },
  {
    id: 'e3',
    title: 'AI 辅助编程时，如何有效控制上下文窗口的成本？',
    excerpt: '项目越来越大，每次让 AI 改代码都要贴很多文件，token 消耗飙升。有没有什么策略可以只让 AI 看到相关的代码片段？',
    tags: [
      { text: '编程辅助', color: 'primary' },
      { text: '最佳实践', color: 'muted' },
    ],
    views: 892,
    answers: 18,
    likes: 47,
    createdAt: '8 小时前',
    hot: 65,
  },
  {
    id: 'e4',
    title: '有没有好用的开源 RAG 框架推荐？',
    excerpt: '需要处理 PDF、Word 和网页三种来源，支持向量检索 + 关键词混合召回，最好有中文分词优化。目前看了 LangChain 和 LlamaIndex，想听听实际落地经验。',
    tags: [
      { text: 'RAG', color: 'primary' },
      { text: '开源工具', color: 'muted' },
    ],
    views: 2150,
    answers: 41,
    likes: 134,
    createdAt: '1 天前',
    hot: 100,
  },
  {
    id: 'e5',
    title: 'Prompt 工程还有必要深入学习吗？',
    excerpt: '随着模型推理能力变强，很多以前的 prompt 技巧似乎失效了。现在投入时间系统学习 prompt 工程是否还值得？',
    tags: [
      { text: 'Prompt', color: 'primary' },
      { text: '职业发展', color: 'muted' },
    ],
    views: 5430,
    answers: 127,
    likes: 402,
    createdAt: '2 天前',
    hot: 150,
  },
  {
    id: 'e6',
    title: 'AI 生成的单元测试，可信度到底怎么样？',
    excerpt: '让 AI 给核心业务逻辑补了一批单元测试，覆盖率上去了，但担心边界条件覆盖不足。大家在实际项目里怎么验证 AI 生成测试的质量？',
    tags: [
      { text: '测试', color: 'primary' },
      { text: '代码质量', color: 'muted' },
    ],
    views: 1876,
    answers: 33,
    likes: 96,
    createdAt: '3 天前',
    hot: 78,
  },
]

export const aiFeatures = [
  {
    icon: 'sparkles',
    title: 'AI 摘要',
    desc: '自动提炼长篇讨论的核心观点，帮你快速抓住重点。',
    color: 'primary',
  },
  {
    icon: 'pen-tool',
    title: 'AI 帮我答',
    desc: '基于问题内容生成回答草稿，再由你润色发布。',
    color: 'success',
  },
  {
    icon: 'search',
    title: '语义搜索',
    desc: '不只是关键词匹配，更能理解你的真实意图。',
    color: 'primary',
  },
]

// 问题详情数据
export const questionDetail = {
  id: 'd1',
  title: 'React useEffect 在依赖数组完整的情况下仍重复执行，如何排查？',
  tags: ['react', 'hooks'],
  content: `我在组件里写了一个 useEffect，依赖数组已经填了所有用到的变量，但浏览器里发现它还是会无限循环执行。我把依赖打印出来看，值并没有变化。

我怀疑是引用类型的问题，但不确定怎么快速定位。请问有哪些排查步骤可以确认真正导致 effect 重新执行的依赖？`,
  codeSnippet: `useEffect(() => {
  fetchUser(filter);
}, [filter]);

// filter 在父组件通过 useState 初始化
const [filter, setFilter] = useState({ role: 'admin' });`,
  views: 1248,
  createdAt: '2026-08-10 14:32',
  aiSummary:
    '该问题通常由依赖数组中的对象/函数引用不稳定导致，React 在每次渲染时认为依赖发生变化，从而重复触发 effect。建议优先使用 useMemo/useCallback 稳定依赖，或通过 eslint-plugin-react-hooks 的 exhaustive-deps 规则定位遗漏。',
  aiSummarySources: [1, 2],
  answers: [
    {
      id: 'a1',
      type: 'ai',
      title: 'AI 生成的回答草稿',
      content:
        '这是一个典型的「引用不稳定」问题。父组件每次渲染时，如果 filter 是直接在 JSX 里创建的对象字面量，那么它的引用会变化。建议在父组件用 useMemo 包装 filter，或在子组件里用 useDeepCompareEffect 做深度比较。',
      helpful: true,
      createdAt: '刚刚',
    },
    {
      id: 'a2',
      type: 'user',
      author: '匿名用户 #8A3F',
      content:
        '分享一个我的排查小技巧：在 useEffect 里对依赖 Object.entries() 逐个打印 JSON.stringify，这样能马上发现是哪个引用值在变化。另外，React 18 的 StrictMode 在开发模式下会故意双调用，记得也排除这个因素。',
      likes: 24,
      createdAt: '1 小时前',
    },
    {
      id: 'a3',
      type: 'user',
      author: '匿名用户 #2C91',
      content:
        '推荐安装 eslint-plugin-react-hooks 并开启 exhaustive-deps，它的报错信息基本可以直接定位到问题。90% 的重复执行都是因为依赖数组有遗漏或者对象引用没稳定。',
      likes: 12,
      createdAt: '3 小时前',
    },
  ],
}

// 搜索结果
export const searchResults = {
  query: 'useEffect 执行两次',
  aiSummary: [
    {
      text: 'React 18 的严格模式在开发环境下会故意双重调用某些函数，以检测副作用。',
      source: 1,
    },
    {
      text: '依赖数组为空时，如果组件被挂载两次，useEffect 内部无清理函数会导致重复订阅或请求。',
      source: 2,
    },
    {
      text: '建议通过返回清理函数、使用 ref 或借助稳定的状态管理来避免二次执行带来的问题。',
      source: 3,
    },
  ],
  relatedPosts: [
    {
      id: 's1',
      title: '为什么 useEffect 会在 React 18 中执行两次？',
      excerpt: '升级到 React 18 后发现 useEffect 在开发模式下会运行两次，这是正常现象吗？需要如何避免副作用重复触发？',
      tag: 'React',
      tagColor: 'primary',
      answers: 24,
      likes: 132,
      createdAt: '2 天前',
    },
    {
      id: 's2',
      title: 'useEffect 清理函数的最佳实践',
      excerpt: '详细讲解了在 effect 中注册事件监听器、定时器或请求时，如何通过返回清理函数保证组件卸载时不泄露。',
      tag: 'Hooks',
      tagColor: 'muted',
      answers: 18,
      likes: 96,
      createdAt: '1 周前',
    },
    {
      id: 's3',
      title: 'StrictMode 对开发体验的影响',
      excerpt: 'StrictMode 会故意双重渲染组件，帮助你发现不纯的渲染逻辑和缺少清理的副作用。',
      tag: '进阶',
      tagColor: 'muted',
      answers: 11,
      likes: 74,
      createdAt: '3 天前',
    },
    {
      id: 's4',
      title: '如何用 useRef 避免 useEffect 重复请求',
      excerpt: '通过 ref 标记请求状态，防止 React 18 严格模式下的双重调用导致接口重复请求。',
      tag: '实战',
      tagColor: 'muted',
      answers: 9,
      likes: 58,
      createdAt: '5 天前',
    },
    {
      id: 's5',
      title: 'useEffect 依赖数组填写指南',
      excerpt: '全面梳理 effect 依赖项的填写规则，以及 ESLint 插件如何帮助检查遗漏依赖。',
      tag: '指南',
      tagColor: 'muted',
      answers: 31,
      likes: 210,
      createdAt: '2 周前',
    },
  ],
}

// Dashboard 数据
export const dashboardData = {
  metrics: [
    { label: 'AI 使用次数', value: 24, icon: 'bot' },
    { label: 'AI 摘要生成', value: 8, icon: 'file-text' },
    { label: '回答草稿', value: 5, icon: 'pen-tool' },
    { label: '语义搜索', value: 3, icon: 'search' },
  ],
  featureDistribution: [
    { feature: 'AI 摘要', count: 8 },
    { feature: 'AI 帮我答', count: 5 },
    { feature: 'AI 润色', count: 6 },
    { feature: 'AI 扩写', count: 2 },
    { feature: '生成草稿', count: 3 },
    { feature: '语义搜索', count: 3 },
  ],
  helpfulRate: 78,
  identity: {
    name: '好奇的犀牛',
    id: '0x9a4f…e28c',
    createdAt: '2025-03-12',
    postsCount: 12,
    answersCount: 28,
  },
}
