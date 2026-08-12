const AUTHOR_A = 'aaaaaaaa-aaaa-4000-8000-000000000001';
const AUTHOR_B = 'bbbbbbbb-bbbb-4000-8000-000000000002';
const AUTHOR_C = 'cccccccc-cccc-4000-8000-000000000003';
const AUTHOR_D = 'dddddddd-dddd-4000-8000-000000000004';
const AUTHOR_AI = 'ai-system';

const NOW = Date.now();
const DAY_MS = 86400000;
const HOUR_MS = 3600000;

const seedQuestions = [
  {
    id: '11111111-1111-4000-8000-000000000001',
    title: 'React useEffect 在依赖数组完整的情况下仍重复执行，如何排查？',
    titleRaw: 'React useEffect 在依赖数组完整的情况下仍重复执行，如何排查？',
    body: '最近在写一个 React 18 组件，useEffect 的依赖数组已经列全了所有用到的变量，但还是发现 effect 会重复触发。\n\n具体场景：在 StrictMode 开发环境下尤为明显，fetch 数据会请求两次。另外当父组件重渲染时，即使 props 传进来的引用类型对象值一样，effect 也会重新跑。\n\n有没有系统的排查思路？',
    tags: ['react', 'hooks', 'useEffect'],
    authorId: AUTHOR_A,
    status: 'summarized',
    aiAssisted: true,
    relatedQuestionIds: [],
    viewCount: 3820,
    answerCount: 3,
    createdAt: NOW - 45 * DAY_MS,
    updatedAt: NOW - 45 * DAY_MS + HOUR_MS,
  },
  {
    id: '11111111-1111-4000-8000-000000000002',
    title: 'Python 多进程 vs 多线程，CPU 密集型与 IO 密集型场景应如何选择？',
    titleRaw: 'Python 多进程 vs 多线程，CPU 密集型与 IO 密集型场景应如何选择？',
    body: '写了一个爬虫，用了 threading 提速不明显，后来改用 multiprocessing 感觉快了很多。又试了下跑一个加密计算，多线程几乎没提升，多进程能线性扩展。\n\n想从原理层面理解：GIL 到底是什么？为什么它会影响 CPU 密集型但不影响 IO 密集型？concurrent.futures.ThreadPoolExecutor 和 ProcessPoolExecutor 选型依据是什么？',
    tags: ['python', '并发', '多进程', 'GIL'],
    authorId: AUTHOR_A,
    status: 'summarized',
    aiAssisted: true,
    relatedQuestionIds: [],
    viewCount: 4510,
    answerCount: 3,
    createdAt: NOW - 52 * DAY_MS,
    updatedAt: NOW - 52 * DAY_MS + HOUR_MS,
  },
  {
    id: '11111111-1111-4000-8000-000000000003',
    title: 'JavaScript 事件循环中 microtask（Promise）和 macrotask（setTimeout）的执行顺序？',
    titleRaw: 'JavaScript 事件循环中 microtask（Promise）和 macrotask（setTimeout）的执行顺序？',
    body: '面试常考的一道题：console.log 先打印，然后 Promise.then，最后 setTimeout 的回调执行。\n\n但如果嵌套多层呢？比如在一个 setTimeout 里再塞 Promise 和 setTimeout，顺序又会怎样？希望有人能把「执行栈→microtask 队列→macrotask 队列」的循环机制讲清楚，带个嵌套例子。',
    tags: ['javascript', '事件循环', '异步'],
    authorId: AUTHOR_A,
    status: 'summarized',
    aiAssisted: true,
    relatedQuestionIds: [],
    viewCount: 2980,
    answerCount: 3,
    createdAt: NOW - 38 * DAY_MS,
    updatedAt: NOW - 38 * DAY_MS + HOUR_MS,
  },
  {
    id: '11111111-1111-4000-8000-000000000004',
    title: 'CSS Flexbox 水平垂直居中的 3 种常用写法？',
    titleRaw: 'CSS Flexbox 水平垂直居中的 3 种常用写法？',
    body: '写了几年 CSS，居中永远是查了忘、忘了查。想把 Flexbox 居中的几种主流写法整理一下，要求：\n\n1. 容器高度已知和未知两种情况都能处理\n2. 适用于单元素和多元素（比如按钮组）\n3. 兼容性到 IE11 或至少现代浏览器\n\n最好每种写法附上简单的 HTML 结构示例和适用场景说明。',
    tags: ['css', 'flexbox', '布局'],
    authorId: AUTHOR_A,
    status: 'summarized',
    aiAssisted: true,
    relatedQuestionIds: [],
    viewCount: 1560,
    answerCount: 3,
    createdAt: NOW - 33 * DAY_MS,
    updatedAt: NOW - 33 * DAY_MS + HOUR_MS,
  },
  {
    id: '11111111-1111-4000-8000-000000000005',
    title: '快速排序 vs 归并排序，时间复杂度、空间复杂度、稳定性对比？',
    titleRaw: '快速排序 vs 归并排序，时间复杂度、空间复杂度、稳定性对比？',
    body: '算法课学了这两个经典排序，都是分治思想，但具体区别总是记混。\n\n想整理一个对比表，包含：平均/最坏/最好时间复杂度、空间复杂度、是否稳定、partition 策略、是否原地排序、实际应用场景（比如为什么 Java Arrays.sort 对基本类型用快排，对对象用 TimSort/归并？）',
    tags: ['算法', '排序', '数据结构'],
    authorId: AUTHOR_A,
    status: 'summarized',
    aiAssisted: true,
    relatedQuestionIds: [],
    viewCount: 2100,
    answerCount: 3,
    createdAt: NOW - 41 * DAY_MS,
    updatedAt: NOW - 41 * DAY_MS + HOUR_MS,
  },
  {
    id: '11111111-1111-4000-8000-000000000006',
    title: 'React 18 中 useRef、useMemo、useCallback 的使用场景区别？',
    titleRaw: 'React 18 中 useRef、useMemo、useCallback 的使用场景区别？',
    body: '这三个 Hook 都是「缓存」相关，经常分不清什么时候该用哪个。\n\n比如：\n- 保存一个不触发渲染的可变值：useRef\n- 缓存一个计算结果：useMemo\n- 缓存一个函数引用：useCallback\n\n但实际写的时候经常混用。希望有人能把「引用相等性」这个核心点讲透，再给 3 个反例（不该用却用了的场景）。',
    tags: ['react', 'hooks', '性能优化'],
    authorId: AUTHOR_A,
    status: 'summarized',
    aiAssisted: true,
    relatedQuestionIds: [],
    viewCount: 4230,
    answerCount: 3,
    createdAt: NOW - 58 * DAY_MS,
    updatedAt: NOW - 58 * DAY_MS + HOUR_MS,
  },
  {
    id: '11111111-1111-4000-8000-000000000007',
    title: 'Python 3.13 PEP 703 的 GIL 禁用模式是什么？对现有代码有哪些影响？',
    titleRaw: 'Python 3.13 PEP 703 的 GIL 禁用模式是什么？对现有代码有哪些影响？',
    body: '听说 Python 3.13 实验性支持了 nogil 模式，可以通过 PYTHON_GIL=0 关闭全局解释器锁。\n\n想了解：\n1. 「无 GIL」模式下对象是怎么保证线程安全的？引用计数改成啥了？\n2. 现有 C 扩展（比如 numpy、pandas）需要重写吗？\n3. 单线程性能有没有退化？\n4. 对 CPU 密集型代码，真正能拿到多少倍的多线程加速？',
    tags: ['python', 'GIL', 'PEP703'],
    authorId: AUTHOR_A,
    status: 'summarized',
    aiAssisted: true,
    relatedQuestionIds: [],
    viewCount: 4980,
    answerCount: 3,
    createdAt: NOW - 30 * DAY_MS,
    updatedAt: NOW - 30 * DAY_MS + HOUR_MS,
  },
  {
    id: '11111111-1111-4000-8000-000000000008',
    title: 'async/await 如何实现顺序执行多个异步任务？forEach 中用 await 为什么不行？',
    titleRaw: 'async/await 如何实现顺序执行多个异步任务？forEach 中用 await 为什么不行？',
    body: '踩坑记录：想按顺序调 3 个 API，结果用 forEach 包 await 发现 3 个请求并发发出去了。换成 for 循环就对了。\n\n希望有人从语法层面解释：\n1. forEach 的回调里 await 实际上在「等待」什么？\n2. 为什么 for...of 可以顺序执行而 forEach 不行？\n3. 除了 for...of，还有哪些写法可以顺序+并发控制（比如控制最大并发数为 2）？',
    tags: ['javascript', 'async', 'promise'],
    authorId: AUTHOR_A,
    status: 'summarized',
    aiAssisted: true,
    relatedQuestionIds: [],
    viewCount: 2670,
    answerCount: 3,
    createdAt: NOW - 48 * DAY_MS,
    updatedAt: NOW - 48 * DAY_MS + HOUR_MS,
  },
  {
    id: '11111111-1111-4000-8000-000000000009',
    title: 'CSS Grid 与 Flexbox 的适用场景差异？举例说明',
    titleRaw: 'CSS Grid 与 Flexbox 的适用场景差异？举例说明',
    body: '布局时总在纠结用 Grid 还是 Flexbox。有些场景两者都能实现，但代码量和可读性差别很大。\n\n希望整理出一个清晰的决策框架：\n1. 一维布局 vs 二维布局的本质区别\n2. 典型场景：导航栏、卡片网格、仪表盘、表单、相册墙分别推荐哪个？\n3. 混合使用的案例：外层 Grid，内层 Flex\n4. 浏览器兼容性 2024 年的现状',
    tags: ['css', 'grid', 'flexbox'],
    authorId: AUTHOR_A,
    status: 'summarized',
    aiAssisted: true,
    relatedQuestionIds: [],
    viewCount: 1890,
    answerCount: 3,
    createdAt: NOW - 36 * DAY_MS,
    updatedAt: NOW - 36 * DAY_MS + HOUR_MS,
  },
  {
    id: '11111111-1111-4000-8000-000000000010',
    title: '什么是动态规划？与贪心算法的核心区别，给出经典例题',
    titleRaw: '什么是动态规划？与贪心算法的核心区别，给出经典例题',
    body: '刷 LeetCode 时动态规划一直是弱项。感觉「最优子结构」和「重叠子问题」这两个特征总是判断不准。\n\n希望用通俗的语言解释：\n1. DP 的本质是什么？为什么叫「规划」？\n2. DP 与贪心最核心的区别：贪心是「局部最优=全局最优」，那 DP 是啥？\n3. 用同一个例子（比如零钱兑换）演示贪心失败但 DP 成功的情况\n4. 经典 5 道 DP 入门题按难度排序列表',
    tags: ['算法', '动态规划', '贪心'],
    authorId: AUTHOR_A,
    status: 'summarized',
    aiAssisted: true,
    relatedQuestionIds: [],
    viewCount: 3340,
    answerCount: 3,
    createdAt: NOW - 55 * DAY_MS,
    updatedAt: NOW - 55 * DAY_MS + HOUR_MS,
  },
];

const QIDS = seedQuestions.map(q => q.id);

const AUTHOR_ROTATION = [AUTHOR_B, AUTHOR_C, AUTHOR_D];

const answerContentsByQuestion = {
  [QIDS[0]]: [
    {
      author: AUTHOR_A,
      content: `## 排查思路，按优先级排：

### 1. 检查是否是 React 18 StrictMode 导致
StrictMode 在开发环境会**故意双重调用**组件和 Effect，用来检测副作用是否纯净。
这不是 bug，是开发模式的保护机制。生产构建不会发生。

临时验证：把 <StrictMode> 外层去掉，看是否还重复。如果不重复了，说明原因在此。
正确做法：让 Effect 的清理函数能正确抵消副作用（比如用 AbortController 取消 fetch）。

### 2. 检查依赖数组里的「引用类型」
如果依赖项是对象、数组、函数，父组件每次渲染都会创建新引用，导致 Effect 判定「依赖变了」。

解决方案：
- 对象/数组 → 用 useMemo 包裹
- 函数 → 用 useCallback 包裹

\`\`\`jsx
const User = memo(function User({ config }) {
  useEffect(() => {
    fetchData(config);
  }, [config]); // config 是新对象就重跑
});
// 父组件里 <User config={{ a: 1 }} />  → 错，每次新对象
// 改成 const cfg = useMemo(() => ({ a: 1 }), []); <User config={cfg} />
\`\`\`

### 3. 自定义 Hook 返回值导致
如果从自定义 Hook 里拿出来的 state/setter 每次都是新引用，也会出问题。
可以用 Object.is 在 useEffect 里手动打印 diff 排查。

### 4. fetch 里加「mounted 标记」防止竞态
\`\`\`jsx
useEffect(() => {
  let mounted = true;
  fetch(url).then(res => res.json()).then(data => {
    if (mounted) setData(data);
  });
  return () => { mounted = false; };
}, [url]);
\`\`\`
这可以解决 StrictMode 双调用 + 快速切换路由时的状态泄漏。
`,
      upvotes: 156,
    },
    {
      author: AUTHOR_C,
      content: `补充一个**很少被提到但很常见的坑**：location 对象。

如果你用 react-router，不要直接把整个 location 放到依赖数组里：

\`\`\`jsx
const location = useLocation();
useEffect(() => {
  // ...
}, [location]); // ❌ 每次路由切换即使 pathname 一样也可能变
\`\`\`

location 对象里包含 key 属性，每次 push 都会变。应该只取你需要的字段：

\`\`\`jsx
const { pathname, search } = useLocation();
useEffect(() => { /* ... */ }, [pathname, search]); // ✅
\`\`\`

同理：react-router v6 的 useNavigate 返回的 navigate 函数是稳定引用，可以安全放依赖数组；但 useParams 每次返回的对象可能是新引用。

另外推荐一个调试小技巧：把 useEffect 拆出来，给每个依赖单独加 console.log 看哪个变了。或者用 useWhyDidYouUpdate 这个自定义 Hook（网上搜一下代码）。
`,
      upvotes: 89,
    },
    {
      author: AUTHOR_AI,
      isAI: true,
      content: `## useEffect 重复执行综合排查清单

根据两位答主的回答整理出系统化排查路径：

### 一、开发环境特有问题
- **StrictMode 双调用**：React 18 + \`<StrictMode>\` 会故意双跑 Effect 来检测副作用纯度
  - 验证方法：移除 StrictMode 包装后观察是否仍重复
  - 正确修复：为 Effect 编写**幂等**的清理函数（\`return () => { ... }\`）

### 二、引用类型依赖不稳定
- **对象/数组/函数**作为依赖时，即使值相同，引用不同也会触发 Effect
  - 对象/数组 → \`useMemo\` 包裹
  - 函数 → \`useCallback\` 包裹
  - 反例：JSX 中直接写 \`<Comp prop={{ a:1 }} />\` 每次创建新对象

### 三、路由/第三方 Hook 返回值
- \`useLocation()\` 返回的 location 对象包含 \`key\` 会变，只解构需要的字段（\`pathname, search\`）
- \`useParams()\` 每次渲染返回新对象引用，取出具体字段再放入依赖

### 四、防竞态通用写法
\`\`\`jsx
useEffect(() => {
  let mounted = true;
  fetch(url)
    .then(r => r.json())
    .then(d => { if (mounted) setData(d); });
  return () => { mounted = false; };
}, [url]);
\`\`\`

如果以上都排查过仍重复，可以使用 \`useWhyDidYouUpdate\` 自定义 Hook 精确定位变化的依赖项。
`,
      upvotes: 200,
    },
  ],
  [QIDS[1]]: [
    {
      author: AUTHOR_C,
      content: `## 先把 GIL 讲明白

Python 的 GIL（全局解释器锁）是一把**互斥锁**，同一时刻只允许一个线程执行 Python 字节码。
所以多线程在 Python 里其实是「伪并发」——CPU 时间片在线程间切换，但真正并行跑 Python 代码的只有一个线程。

但是！GIL 会在 IO 操作（sleep、网络请求、磁盘读写）时主动释放。所以 IO 密集型场景，多线程其实能利用到「等待 IO 的时间」跑别的线程，性能可以提升。

而 CPU 密集型场景，线程基本都在算，GIL 抢来抢去的开销反而可能让多线程比单线程还慢。

## 多进程为什么能破 GIL？

每个进程有自己独立的解释器、独立的 GIL，进程之间完全隔离。所以多进程能真正利用多核 CPU 并行跑计算。
代价：进程间通信（IPC）开销比线程大，数据要 pickle 序列化/反序列化。

## 选型表

| 场景类型 | 推荐方案 | 原因 |
| --- | --- | --- |
| CPU 密集（加密、压缩、计算） | multiprocessing / ProcessPoolExecutor | 绕过 GIL，真正多核并行 |
| IO 密集（爬虫、HTTP 请求、DB） | threading / ThreadPoolExecutor / asyncio | GIL 在 IO wait 时释放，开销低 |
| 混合场景 | 多进程 + 进程内 asyncio | 分层解决 |

补充：asyncio 是单线程协程，比线程调度开销更低，但所有代码必须是非阻塞的（不能有同步 IO）。
`,
      upvotes: 180,
    },
    {
      author: AUTHOR_D,
      content: `补充一个非常实用的对比代码模板，直接跑就能看出差异：

\`\`\`python
import time
import threading
import multiprocessing as mp

# CPU 密集型任务
def cpu_work(n=50_000_000):
    s = 0
    for i in range(n):
        s += i
    return s

def io_work(n=200):
    for _ in range(n):
        time.sleep(0.005)  # 模拟 IO wait

# 单线程
start = time.time(); cpu_work(); print('单线程CPU:', time.time() - start)

# 多线程 CPU
start = time.time()
t1 = threading.Thread(target=cpu_work, args=(25_000_000,))
t2 = threading.Thread(target=cpu_work, args=(25_000_000,))
t1.start(); t2.start(); t1.join(); t2.join()
print('多线程CPU:', time.time() - start)  # 基本和单线程一样，甚至更慢

# 多进程 CPU
start = time.time()
p1 = mp.Process(target=cpu_work, args=(25_000_000,))
p2 = mp.Process(target=cpu_work, args=(25_000_000,))
p1.start(); p2.start(); p1.join(); p2.join()
print('多进程CPU:', time.time() - start)  # 4核机器 ~2x 加速
\`\`\`

关键观察点：多进程数量不要超过 CPU 核心数（\`os.cpu_count()\`），否则上下文切换开销反而增大。

IO 密集型大家可以自己改 io_work 跑一下，线程和 asyncio 都能明显加速，多进程反而因为 IPC 开销可能最慢。
`,
      upvotes: 128,
    },
    {
      author: AUTHOR_AI,
      isAI: true,
      content: `## Python 并发选型：核心结论与决策树

综合两位答主的回答，形成以下决策框架：

### 一、GIL 的影响范围
GIL 只限制 **Python 字节码的并行执行**。
- 遇 IO（sleep/socket/file/DB）会主动释放 → 多线程在 IO 等待期间可有效并发
- C 扩展可主动释放 GIL（如 numpy 内部计算）→ 这类代码多线程也能拿到并行加速
- 纯 Python 计算密集 → GIL 成为瓶颈，多线程基本无加速

### 二、三种方案对比表

| 维度 | threading | multiprocessing | asyncio |
| --- | --- | --- | --- |
| 并发模型 | 多线程，共享内存 | 多进程，独立内存 | 单线程协程 |
| 绕过 GIL | ❌ | ✅ | ❌（单线程不需要） |
| 适用场景 | IO 密集 | CPU 密集 | 高并发 IO |
| 数据共享 | ✅ 简单（需锁） | ❌ 复杂（Queue/Manager） | ✅ 天然共享 |
| 开销 | 中 | 高（IPC+pickle） | 极低 |

### 三、决策流程
1. **任务是否 IO 密集？** → 是 → 2；否 → 3
2. **并发规模？** → 几百线程以内用 ThreadPoolExecutor；大规模用 asyncio（全部非阻塞）
3. **CPU 密集 → 用 ProcessPoolExecutor**，进程数 ≤ \`os.cpu_count()\`，数据分片要均衡

### 四、常见坑提醒
- 不要在 Windows 下的多进程代码里把函数写在 \`if __name__ == '__main__'\` 外面（spawn 启动方式会重复导入）
- ThreadPoolExecutor 的 max_workers 不要瞎开，IO 密集一般 10~50，多了反而慢
- 跨进程传输大数据要用 \`shared_memory\`（Python 3.8+）避免反复 pickle
`,
      upvotes: 195,
    },
  ],
  [QIDS[2]]: [
    {
      author: AUTHOR_B,
      content: `## 事件循环机制，一步一步来

### 基本概念
- **调用栈（Call Stack）**：同步代码在这里执行，LIFO
- **Microtask 队列**：Promise.then/catch/finally、queueMicrotask、MutationObserver、async 函数里 await 之后的代码
- **Macrotask 队列（Task Queue）**：setTimeout、setInterval、setImmediate（Node）、I/O、UI 渲染

### 执行顺序规则
1. 从调用栈开始，执行**所有同步代码**直到栈空
2. 栈空后，**一次性清空 Microtask 队列**（所有任务，一个不留）
3. 清空 Microtask 后，浏览器可能会执行 UI 渲染
4. 从 Macrotask 队列中取**一个**（只一个）最老的任务执行
5. 回到步骤 2（清空 Microtask）→ 步骤 4 → 循环

### 嵌套例题
\`\`\`js
console.log('1');
setTimeout(() => {
  console.log('2');
  Promise.resolve().then(() => console.log('3'));
}, 0);
Promise.resolve().then(() => {
  console.log('4');
  setTimeout(() => console.log('5'), 0);
});
console.log('6');
\`\`\`

**输出：1 → 6 → 4 → 2 → 3 → 5**

走一遍：
- 同步代码：打印 1、setTimeout 入 MT 队列（T1）、Promise.then 入 Mi 队列（M1）、打印 6 → 栈空
- 清空 Mi 队列：执行 M1 → 打印 4，setTimeout 入 MT 队列（T2） → Mi 空
- 取一个 MT：执行 T1 → 打印 2，Promise.then 入 Mi（M2）
- 清空 Mi：执行 M2 → 打印 3 → Mi 空
- 取一个 MT：执行 T2 → 打印 5

核心：每次取一个宏任务之前，必须把所有微任务全清空。
`,
      upvotes: 210,
    },
    {
      author: AUTHOR_D,
      content: `补充一个很容易忽略的点：**await 之后的代码也是 microtask**。

看这个例子：
\`\`\`js
async function foo() {
  console.log('A');
  await Promise.resolve();
  console.log('B');
}
console.log('C');
foo();
console.log('D');
\`\`\`

输出：**C → A → D → B**

等价于：
\`\`\`js
function foo() {
  console.log('A');
  return Promise.resolve().then(() => {
    console.log('B');
  });
}
\`\`\`

另外 Node.js 里还多了 setImmediate 和 process.nextTick，优先级更复杂：
- process.nextTick（Node 独有，优先级最高，甚至在微任务之前）
- microtask（Promise.then 等）
- macrotask 里 setTimeout/setInterval vs setImmediate 的顺序，和当前阶段有关（事件循环 6 阶段模型）

但浏览器环境就记规则：同步 → 全部微任务 → 一个宏任务 → 全部微任务 → 一个宏任务... 循环。
`,
      upvotes: 95,
    },
    {
      author: AUTHOR_AI,
      isAI: true,
      content: `## JavaScript 事件循环：执行顺序完全手册

整合两位答主的回答，给出浏览器环境下事件循环的完整理解：

### 一、核心队列与优先级

| 层级 | 内容 | 执行时机 |
| --- | --- | --- |
| 调用栈 | 同步代码、函数调用 | 立即执行，优先级最高 |
| Microtask 队列 | Promise.then/catch/finally、queueMicrotask、MutationObserver、**await 之后代码** | 调用栈空后**全部清空** |
| Macrotask 队列 | setTimeout、setInterval、requestAnimationFrame、I/O、UI 事件 | 每次取**1 个**，然后重新清空 Microtask |

### 二、嵌套执行的循环图
\`\`\`
 ┌───────────────────────────────────────────┐
 │ 1. 执行同步代码直到 Call Stack 空         │
 └─────────────────────┬─────────────────────┘
                       ↓
 ┌───────────────────────────────────────────┐
 │ 2. Microtask Queue：**一次性全部清空**    │ ← 新入队的 Microtask 也在本轮执行
 └─────────────────────┬─────────────────────┘
                       ↓
 ┌───────────────────────────────────────────┐
 │ 3. （浏览器可选）执行 UI Rendering        │
 └─────────────────────┬─────────────────────┘
                       ↓
 ┌───────────────────────────────────────────┐
 │ 4. Macrotask Queue：取最老的 **1 个**执行 │
 └─────────────────────┬─────────────────────┘
                       └───── 回到步骤 2 ───┘
\`\`\`

### 三、面试题例题输出
例题（参见答主 B 的嵌套例）输出：**1 → 6 → 4 → 2 → 3 → 5**

另一个常见变式：把 setTimeout(fn, 0) 换成 queueMicrotask(fn)，输出顺序会完全不同，因为后者属于 Microtask。

### 四、易错点
- await 之后的代码**不是**同步代码，而是作为 Promise.then 的回调注册到 Microtask
- 同一个 tick 中，Microtask 内新加入的 Microtask 会在**同轮**继续执行（不会等到下一轮）
- setTimeout(fn, 0) 的实际延迟最小为 4ms（HTML 规范，嵌套 ≥ 5 层时）
`,
      upvotes: 188,
    },
  ],
  [QIDS[3]]: [
    {
      author: AUTHOR_D,
      content: `## 写法 1：父容器 justify-center + align-items-center（最常用）

适用于：容器高度已知或由内容撑开都行，**单个或多个**子元素。

\`\`\`html
<div class="container">
  <div class="box">内容</div>
</div>
<style>
.container {
  display: flex;
  justify-content: center;   /* 水平居中 */
  align-items: center;       /* 垂直居中 */
  height: 400px;             /* 需要有高度，不然看不出垂直 */
}
.box { /* 任意宽高都可以 */ }
</style>
\`\`\`

注意：如果容器不设 height，那高度 = 子元素高度，垂直居中看不出来效果。

## 写法 2：子元素 margin: auto（单行子元素专用）

适用于：**单个子元素**，父容器有明确高度。最简洁。

\`\`\`css
.container {
  display: flex;
  height: 400px;
}
.box {
  margin: auto;  /* 上下左右全 auto，自动均分剩余空间 */
}
\`\`\`

这写法还能用于「一个元素在左，另一个元素居中」场景：给左边元素加 \`margin-right: auto\`。

## 写法 3：父容器 flex-direction: column + 双 axis 居中

适用于：子元素是**上下排列**（比如标题 + 按钮组），整体水平垂直都居中。

\`\`\`css
.container {
  display: flex;
  flex-direction: column;
  justify-content: center;  /* 注意：column 后，justify 变成垂直方向 */
  align-items: center;      /* align 变成水平方向 */
  height: 400px;
  gap: 16px;                /* 子元素之间的间距 */
}
\`\`\`

这里容易搞反：flex-direction 变了之后，justify-content 和 align-items 的方向也会对调！

> 兼容性：三种写法在 Chrome/FF/Safari/Edge 都没问题，IE11 支持前两种（第三种 flex-direction: column 在 IE11 有坑，需要 min-height 配合）。
`,
      upvotes: 132,
    },
    {
      author: AUTHOR_B,
      content: `补充一个**多元素混合场景**：比如一个容器里有两个按钮组，一组靠左一组靠右，同时整体垂直居中。

写法其实很简单，用到了 \`margin-left: auto\` 推右边元素的技巧：

\`\`\`html
<div class="toolbar">
  <div class="left-group">
    <button>保存</button>
    <button>取消</button>
  </div>
  <div class="right-group">
    <button>删除</button>
  </div>
</div>
<style>
.toolbar {
  display: flex;
  align-items: center;       /* 垂直居中 */
  height: 64px;
  padding: 0 24px;
}
.left-group  { display: flex; gap: 8px; }
.right-group { display: flex; margin-left: auto; }  /* ✨ auto 把右边推到最右 */
</style>
\`\`\`

再补一个 2024 年更现代的写法：**Grid 一行搞定居中**，比 Flexbox 更短：

\`\`\`css
.container {
  display: grid;
  place-items: center;   /* = justify-items + align-items */
  height: 400px;
}
\`\`\`

但 Flexbox 的优势在**一行多个元素**时的精细控制，Grid 对「二维布局」更友好。
`,
      upvotes: 76,
    },
    {
      author: AUTHOR_AI,
      isAI: true,
      content: `## Flexbox 居中：3 种标准写法 + 选型速查表

整合答主 D 和答主 B 的内容，整理如下：

### 写法一：双轴居中（万能写法）⭐️ 最常用
\`\`\`css
.parent {
  display: flex;
  justify-content: center;  /* 主轴（默认水平）居中 */
  align-items: center;      /* 交叉轴（默认垂直）居中 */
  height: XXX;              /* 需要父容器有高度 */
}
\`\`\`
- 适用：单/多子元素都行，子元素横向排列
- 兼容性：IE11 ✅

### 写法二：子元素 margin: auto（最简写法）
\`\`\`css
.parent { display: flex; height: XXX; }
.child  { margin: auto; }
\`\`\`
- 适用：**单个子元素**，最简洁
- 扩展：\`margin-left: auto\` 可把单个元素推向右侧（按钮组右对齐常用）

### 写法三：纵向排列 + 双轴居中
\`\`\`css
.parent {
  display: flex;
  flex-direction: column;   /* 改变主轴为垂直方向 */
  justify-content: center;  /* 垂直居中 */
  align-items: center;      /* 水平居中 */
  gap: 16px;
  height: XXX;
}
\`\`\`
- 适用：标题+按钮组等上下堆叠内容整体居中
- ⚠️ 注意：flex-direction 改变后，justify/align 的方向也对调

### 选型速查表
| 场景 | 推荐写法 |
| --- | --- |
| 单个元素水平垂直居中 | 写法二（最短） |
| 多个横向元素整体居中 | 写法一 |
| 多个纵向元素整体居中 | 写法三 |
| 左右两端分布（左一组+右一组） | 写法一 + 右侧 margin-left:auto |
| 2024 现代浏览器超简写法 | Grid \`place-items: center\` |

### IE11 坑提醒
写法三在 IE11 下 min-height 会失效，解决方案：给父容器额外包一层并使用 height 而非 min-height。
`,
      upvotes: 168,
    },
  ],
  [QIDS[4]]: [
    {
      author: AUTHOR_C,
      content: `## 对比总表

| 维度 | 快速排序 QuickSort | 归并排序 MergeSort |
| --- | --- | --- |
| **平均时间** | O(n log n) | O(n log n) |
| **最坏时间** | O(n²) — 有序数组 + 选首尾为 pivot 时 | O(n log n) — 稳定 |
| **最好时间** | O(n log n) 或三向切分可到 O(n) | O(n log n) |
| **空间复杂度** | O(log n) — 递归栈开销（原地排序版本） | O(n) — 需要辅助数组 |
| **稳定性** | ❌ 不稳定 | ✅ 稳定 |
| **是否原地** | ✅ 原地排序（in-place） | ❌ 非原地 |
| **分区策略** | 选 pivot → 分块（partition） | 切两半 → 各自排序 → 合并（merge） |
| **缓存局部性** | ✅ 好（连续内存访问） | ❌ 一般（合并阶段跨数组跳） |

## 稳定性是什么意思？

稳定性 = 数组中两个**相等**的元素，排序后相对位置是否保持不变。
比如：[ (2, 'A'), (1, 'B'), (2, 'C') ] 按第一个元素排序
- 稳定排序后两个 2 的顺序仍然是 A 在前、C 在后
- 不稳定排序可能变成 C 在前

所以**对象数组按某个字段排序时**，如果需要保留同字段的原有相对顺序，必须选稳定排序（归并或 TimSort）。

## 实际应用
- **C/C++ std::sort**：混合排序（IntroSort = 快排 + 堆排 + 插入排序），不稳定
- **Java Arrays.sort 基本类型**：DualPivotQuicksort（快排变种），不稳定
- **Java Arrays.sort 对象类型**：TimSort（归并变种），**稳定** — 对象可能有相等但不等价的情况
- **Python list.sort / sorted**：TimSort，**稳定**
- **Go sort.Slice**：不稳定；sort.SliceStable：稳定

## 为什么 Java 对基本类型和对象用不同排序？
基本类型的两个相等值没区别（两个 int 3 完全等价），不稳定无所谓，用快排更快。
对象即使比较字段相等，两个对象仍可能不同，需要稳定排序保证行为可预期。
`,
      upvotes: 195,
    },
    {
      author: AUTHOR_D,
      content: `补充快排最坏情况 O(n²) 的**具体触发条件和规避方法**：

### 触发 O(n²) 的情况
1. 数组**已经有序**（升序或降序），且 pivot 选第一个或最后一个
2. 数组**元素全相等**（如果没有三向切分优化）

每次 partition 只能分 1 个和 n-1 个元素，递归深度变成 n，总操作 = n + (n-1) + (n-2) + ... = O(n²)

### 规避方法
- **随机选 pivot**：随机选一个元素和首元素交换，再以首元素为基准。期望时间 O(n log n)，最坏仍可能 O(n²) 但概率极低
- **三数取中**：选首、中、尾三个元素的中位数做 pivot，有序数组场景被堵死
- **三向切分（Dutch National Flag）**：把数组分成 < pivot、= pivot、> pivot 三段，大量重复元素时从 O(n²) 降到 O(n)

### 手写快排核心代码（三数取中 + 双指针）
\`\`\`java
void quickSort(int[] a, int l, int r) {
  if (l >= r) return;
  // 三数取中
  int mid = l + (r - l) / 2;
  if (a[l] > a[mid]) swap(a, l, mid);
  if (a[l] > a[r])   swap(a, l, r);
  if (a[mid] > a[r]) swap(a, mid, r);
  int pivot = a[mid];
  swap(a, mid, r - 1);

  int i = l, j = r - 1;
  while (true) {
    while (a[++i] < pivot);
    while (a[--j] > pivot);
    if (i >= j) break;
    swap(a, i, j);
  }
  swap(a, i, r - 1);
  quickSort(a, l, i - 1);
  quickSort(a, i + 1, r);
}
\`\`\`

归并排序虽然最坏情况更好，但 O(n) 的额外空间在大数据量时压力很大，所以快排在工程实践中更常用（配合各种优化后基本不会出现最坏情况）。
`,
      upvotes: 142,
    },
    {
      author: AUTHOR_AI,
      isAI: true,
      content: `## 快速排序 vs 归并排序：完整对比与工程选型

综合两位答主的分析，整理如下：

### 一、复杂度与特性对比表

| 维度 | 快速排序 | 归并排序 |
| --- | --- | --- |
| 平均时间 | O(n log n) | O(n log n) |
| 最坏时间 | **O(n²)**（可通过优化概率性规避） | **O(n log n)**（始终稳定） |
| 空间复杂度 | **O(log n)**（递归栈，原地版） | **O(n)**（辅助数组） |
| 稳定性 | ❌ 不稳定 | ✅ 稳定 |
| 原地排序 | ✅ 是 | ❌ 否 |
| 缓存友好度 | ✅ 优秀（顺序访问数组片段） | ⚠️ 一般（合并时跨数组跳转） |
| 递归深度 | O(log n) 期望，最坏 O(n) | 严格 O(log n) |

### 二、快排最坏情况 O(n²) 的触发与规避
**触发条件**：
1. 数组有序 + 选首尾为 pivot → 每次只分出 1 个元素
2. 大量重复元素 + 无三向切分优化

**工程优化手段**：
- **三数取中**（首、中、尾中位数）→ 堵死有序数组最坏情况
- **随机 pivot** → 期望 O(n log n)，最坏概率极低
- **三向切分（荷兰国旗算法）** → 重复多时退化为 O(n)
- **小区间转插入排序**（n < 10 时，O(n²) 小数据更快）
- **尾递归优化 / 显式栈迭代** → 避免 StackOverflow

### 三、稳定性的实际意义
稳定性 = 相等元素保持原相对顺序
- **基本类型数组**（int/double）：稳定性无意义 → 选快排
- **对象数组**：相等字段的两个对象可能不等价 → **必须用稳定排序**（归并 / TimSort）

**这就是为什么**：
- Java 基本类型用 DualPivotQuicksort（不稳定），对象类型用 TimSort（稳定）
- Python 只提供 TimSort（一律稳定）

### 四、工程选型建议
| 场景 | 推荐 | 原因 |
| --- | --- | --- |
| 基本类型排序，追求最快 | 快排（或 IntroSort 变体） | 原地 + 缓存友好 |
| 对象数组，需稳定排序 | TimSort / 归并 | 稳定性保证 |
| 链表排序 | 归并排序 | 链表节点无需额外空间，归并 O(1) 合并 |
| 外部排序（磁盘/大数据） | 归并排序 | 天然适合多路归并，顺序读写 |
| 数据量极大且内存紧张 | 快排（原地） | O(log n) 空间 vs O(n) |
`,
      upvotes: 180,
    },
  ],
  [QIDS[5]]: [
    {
      author: AUTHOR_A,
      content: `## 先看一句话定位

| Hook | 存什么 | 读值行为 | 写值是否触发重渲染 | 典型用途 |
| --- | --- | --- | --- | --- |
| **useRef** | 任意值（.current 上） | 直接读 .current | ❌ **不触发** | 存 DOM、定时器 ID、前一渲染的值、不参与 UI 的可变状态 |
| **useMemo** | 计算结果的**值** | 直接拿到值 | —（缓存的是渲染时要用到的值，写要靠外部 state） | 缓存昂贵计算结果、创建引用稳定的对象/数组 |
| **useCallback** | **函数引用** | 直接拿到函数 | — | 缓存函数，传给 memo 子组件作为 props 时避免多余渲染 |

## 核心理解：引用相等性
React 的 useEffect、React.memo、useMemo 的依赖比较，**默认都用 \`Object.is\` 浅比较引用**。

也就是说：
\`\`\`js
{} === {}               // false  → 新对象
() => {} === () => {}   // false  → 新函数
[1,2,3] === [1,2,3]     // false  → 新数组
\`\`\`

所以父组件每次渲染，如果传给 memo 子组件的函数/对象是新创建的，子组件的 memo 就会判定 props 变了，重新渲染。

## 三个典型正例
### useRef 例：存定时器 ID
\`\`\`jsx
const timerRef = useRef(null);
useEffect(() => {
  timerRef.current = setInterval(tick, 1000);
  return () => clearInterval(timerRef.current);
}, []);
// ✅ 存定时器 ID，改 .current 不触发重渲染
\`\`\`

### useMemo 例：过滤大列表
\`\`\`jsx
const visibleItems = useMemo(() => {
  return items.filter(i => i.visible).map(i => expensiveTransform(i));
}, [items]); // 只有 items 变了才重算
\`\`\`

### useCallback 例：传给 memo 子组件
\`\`\`jsx
const handleRemove = useCallback((id) => {
  setList(prev => prev.filter(x => x.id !== id));
}, []);
// ✅ handleRemove 引用稳定，传给 memo 子组件不触发多余渲染
\`\`\`
`,
      upvotes: 172,
    },
    {
      author: AUTHOR_C,
      content: `## 三个不该用却常见的反例

### ❌ 反例 1：useCallback 包裹了但根本没传进子组件
\`\`\`jsx
const handleClick = useCallback(() => { /* ... */ }, []);
return <button onClick={handleClick}>点我</button>;
\`\`\`
这里 handleClick 直接给原生 <button>，用不用 useCallback **完全一样**。
原生 onClick 不在乎引用是否变化，useCallback 只在把函数**作为 props 传给 memo 子组件**时才有用。
（React 19 可能改善，但目前版本确实是浪费。）

### ❌ 反例 2：useMemo 包裹超简单计算
\`\`\`jsx
const doubled = useMemo(() => count * 2, [count]);
\`\`\`
count * 2 一次乘法几个纳秒，useMemo 自己的比较开销 + 内存开销都比计算本身大。
经验法则：**少于 1ms 的计算别用 useMemo**。什么算昂贵？大数组 filter/map、JSON.parse、正则编译等。

### ❌ 反例 3：用 useRef 存「应该参与渲染」的值
\`\`\`jsx
const countRef = useRef(0);
const onClick = () => {
  countRef.current += 1; // ❌ 改了 ref UI 不会更新！
};
return <div>{countRef.current}</div>;
\`\`\`
useRef 改 .current 不会触发重渲染，UI 永远显示 0。需要 UI 响应的值必须用 useState。

## 额外补充：useState 的函数式更新 vs useCallback
很多人写：
\`\`\`jsx
const [n, setN] = useState(0);
const inc = useCallback(() => setN(n + 1), [n]);
\`\`\`
其实可以更干净，改成函数式更新去掉 n 依赖：
\`\`\`jsx
const inc = useCallback(() => setN(prev => prev + 1), []); // ✅ 依赖数组空
\`\`\`
引用更稳定，效果一样。
`,
      upvotes: 155,
    },
    {
      author: AUTHOR_AI,
      isAI: true,
      content: `## useRef / useMemo / useCallback 完全指南：对比 + 反例 + 选型

综合两位答主的内容，整理如下：

### 一、三个 Hook 本质对比

| Hook | 存储目标 | 取值方式 | 变更是否触发渲染 | 缓存失效条件 |
| --- | --- | --- | --- | --- |
| **useRef** | 任意可变值 | \`ref.current\` | **❌ 不触发** | 永不（手动改） |
| **useMemo** | **计算结果值** | 直接使用返回值 | —（作为渲染值使用，变更靠依赖） | 依赖项变化时重算 |
| **useCallback** | **函数引用** | 直接调用返回值 | — | 依赖项变化时重新创建 |

### 二、核心原理：引用相等性
React 的 \`useEffect\` 依赖比较、\`React.memo\` 的 props 比较，**默认都用 \`Object.is\` 做浅比较（比较引用地址）**。

所以：
\`\`\`js
Object.is({}, {})          // false → 新对象
Object.is(()=>{}, ()=>{})  // false → 新函数
Object.is([1,2], [1,2])    // false → 新数组
\`\`\`

这就是为什么需要 useMemo/useCallback：给父组件渲染过程中创建的**引用类型**一个稳定身份，让子组件的 memo / 依赖数组认为它们没变。

### 三、正例代码模板
#### 1️⃣ useRef：存不参与渲染的可变值
\`\`\`jsx
const inputRef = useRef(null);        // DOM 引用
const timerRef = useRef(null);        // 定时器/请求 ID
const prevPropsRef = useRef(props);   // 上一次渲染的值
useEffect(() => { prevPropsRef.current = props; }); // 记录「上一次」
\`\`\`

#### 2️⃣ useMemo：缓存昂贵计算 / 稳定对象引用
\`\`\`jsx
// 昂贵计算
const filtered = useMemo(() => 
  hugeList.filter(f).map(m), [hugeList]
);
// 稳定对象（作为 props 传给 memo 子组件时）
const chartConfig = useMemo(() => ({
  width, height, theme: mode === 'dark' ? darkTheme : lightTheme,
}), [width, height, mode]);
\`\`\`

#### 3️⃣ useCallback：稳定函数引用
\`\`\`jsx
// 用函数式更新去掉 state 依赖
const addItem = useCallback((text) => {
  setItems(prev => [...prev, { id: Date.now(), text }]);
}, []); // ✅ 空依赖，引用永远稳定
// 正确用法：传给 <ExpensiveChild memo/> 作 props
\`\`\`

### 四、反例清单（高频误用）
| ❌ 误用 | 原因 | 修正 |
| --- | --- | --- |
| \`<button onClick={useCallback(...)}>\` | 原生元素/非 memo 子组件不需要稳定引用 | 直接写行内函数 |
| \`useMemo(() => x * 2, [x])\` | 计算开销低于 useMemo 自身开销 | 去掉 useMemo，直接算 |
| useRef 存 UI 要显示的值 | 改 .current 不触发重渲染 | 改用 useState |
| useCallback 依赖数组里放 state，但可以用函数式更新 | 依赖多导致引用不稳定 | 改成 \`setX(prev => ...)\` |
| \`useMemo(() => [a,b], [a,b])\` 里创建数组再返回 | 依赖变化时依然是新数组；但如果有其他大数组逻辑才值得 | 视场景判断 |

### 五、一句话选型
- **不需要参与渲染的可变盒子** → useRef
- **昂贵计算的结果 / 需要稳定引用的对象** → useMemo
- **需要稳定引用、要传给 memo 子组件的函数** → useCallback
`,
      upvotes: 215,
    },
  ],
  [QIDS[6]]: [
    {
      author: AUTHOR_D,
      content: `## PEP 703 是什么：一句话

PEP 703 = Making the Global Interpreter Lock Optional in CPython，即 **让 GIL 变成可选项**。
Python 3.13 作为实验性功能引入，通过 \`PYTHON_GIL=0\` 环境变量或 \`--disable-gil\` 编译标志启用。

## 核心实现机制

### 1. 引用计数改成「biased reference counting（偏向引用计数）」
原 GIL 模式下，引用计数的增减因为有 GIL 保护，完全不用原子操作。
No-GIL 模式下不能这么玩了，于是 CPython 采用了巧妙的「偏向+转让」策略：

- **每个线程**对每个对象都有一个「本线程内的本地引用计数」（非原子，极快）
- 只有当对象「跨线程转让所有权」时，才会走一个较慢的**原子操作全局引用计数**流程
- 大部分对象（单线程内创建和销毁）永远不需要跨线程转让，开销接近原生 GIL 模式

### 2. 其他同步机制
- 分配器（pymalloc）改成每线程 arena + 全局锁降级
- 容器对象（list/dict）的内部修改：对常用操作做了细粒度锁（per-object locking）
- 延迟引用计数（deferred RC）：对一些难处理的内部对象用 epoch-based 方案

## 现有代码的影响
### C 扩展兼容性
- **ABI 不兼容**：No-GIL 模式下 CPython 的结构体布局变了，C 扩展要重新编译
- 新的 C API 宏：\`PyObject_AddRef\` / \`PyObject_RemoveRef\` 替换原来的直接 \`Py_INCREF\`
- 兼容性中间层：很多常用扩展（numpy/pandas 等）正在做适配，短期会有一段兼容期
- 官方承诺：GIL 模式仍然是默认，至少到 Python 3.15+ 才可能变默认

### 单线程性能
官方基准测试（Python 3.13 alpha）：
- **GIL 模式**：基本和 3.12 持平
- **No-GIL 模式**：单线程约 **5~7% 退化**（偏向引用计数的簿记开销）
- 多线程 CPU 密集：8 核机器可以拿到 **5~7x 加速**（理论 8x，扣除调度开销）

## 对开发者的直接影响
1. **短期（3.13~3.14）**：GIL 还是默认，不影响。想试 nogil 要明确指定
2. **中期（3.15+）**：生态逐步跟上，可以把 CPU 密集的部分改用多线程
3. **坑**：以前因为 GIL「意外安全」的代码（比如多线程读写同一个 dict 不加锁），在 nogil 模式下会真正出现 data race。不要依赖 GIL 做线程安全！
`,
      upvotes: 188,
    },
    {
      author: AUTHOR_B,
      content: `补充一个实战测试，用 Python 3.13 alpha 版实际跑了一下 CPU 密集多线程：

\`\`\`python
import threading, time, sys
print("Python:", sys.version)
print("GIL enabled:", getattr(sys, '_is_gil_enabled', lambda: 'N/A')())

def fib(n):
    if n < 2: return n
    return fib(n-1) + fib(n-2)

def run_single_threaded():
    start = time.time()
    fib(40); fib(40)
    return time.time() - start

def run_multi_threaded(n_threads=2):
    start = time.time()
    threads = [threading.Thread(target=fib, args=(40,)) for _ in range(n_threads)]
    for t in threads: t.start()
    for t in threads: t.join()
    return time.time() - start

print("单线程 2x fib(40):", run_single_threaded())
print("2线程 2x fib(40):", run_multi_threaded(2))
\`\`\`

**实测结果（4 核 8 线程笔记本）：**

| 模式 | 单线程 | 2 线程 | 加速比 |
| --- | --- | --- | --- |
| **GIL=1（默认）** | 29.8s | 31.2s | **1.05x（几乎无加速）** |
| **GIL=0（--disable-gil 编译）** | 31.5s（慢 6%） | 16.8s | **1.87x（接近线性！）** |

结论非常直观：
- GIL 模式下多线程跑 CPU 密集，几乎零加速（反而略慢是调度开销）
- No-GIL 模式下单线程略慢一点（5~7% 官方数据和我实测一致）
- 多线程 CPU 密集真正拿到了接近线性的加速

现在生态还在过渡阶段，很多 C 扩展还没适配，生产环境建议 3.14+ 再考虑。但方向已经很明确了：Python 终于要真正支持多线程并行了。
`,
      upvotes: 136,
    },
    {
      author: AUTHOR_AI,
      isAI: true,
      content: `## Python 3.13 PEP 703 No-GIL：原理 · 影响 · 迁移路线

整合两位答主的回答，整理如下：

### 一、PEP 703 是什么
**正式名称**：Making the Global Interpreter Lock Optional in CPython  
**目标**：让 GIL 从「永久存在」变成「可选关闭」，真正支持多线程 CPU 密集并行  
**当前状态**：Python 3.13 实验性引入，默认仍启用 GIL；预计 3.15+ 才可能变默认  
**启用方式**：
- 编译 CPython 时加 \`--disable-gil\`
- 运行时设环境变量 \`PYTHON_GIL=0\`

### 二、核心实现原理
No-GIL 模式下最大的挑战：**原本由 GIL 全局保护的引用计数，如何高效做到线程安全？**

解决方案 = **偏向引用计数（Biased Reference Counting）**：

| 机制 | 说明 |
| --- | --- |
| **本地引用计数** | 每个线程内创建的对象先标记为「该线程独有」，增减引用计数为**非原子操作**（极快） |
| **跨线程转让** | 只有对象被另一个线程访问时，才触发一次较慢的**原子升级**流程，转为全局共享模式 |
| **统计事实** | 绝大多数对象（95%+）从不跨线程 → 大部分操作仍为非原子，整体开销可控 |

配套改造：
- 对象分配器（pymalloc）→ 每线程 arena + 细粒度锁
- list/dict 等容器 → per-object 细粒度锁替代 GIL
- 内部对象 → epoch-based deferred RC 兜底

### 三、性能实测数据（答主 B + 官方基准）

| 场景 | GIL=1（默认） | GIL=0（No-GIL） |
| --- | --- | --- |
| 单线程 CPU 基准 | 100% | **~94%（退化 5~7%）** |
| 2 线程 CPU 并行 | ~100%（无加速） | **~190%（~1.9x 加速）** |
| 8 线程 CPU 并行 | ~105% | **~620%（~6x 加速，8 核机器）** |
| IO 密集多线程 | 良好 | 同样良好 |

### 四、现有代码与生态的影响
#### 1. 纯 Python 代码
- 大部分逻辑**无需修改**
- ⚠️ **重要警告**：以前因 GIL 而「意外线程安全」的代码（多线程操作同一个 dict/list 不加锁），在 No-GIL 下会出现真正的数据竞争。**不要依赖 GIL 做同步！**

#### 2. C 扩展
- **ABI 不兼容**：必须重新编译，CPython 内部结构体布局变化
- **需要适配**：用新的 \`PyObject_AddRef/RemoveRef\` API 替换直接 \`Py_INCREF/DECREF\`
- **生态进度**：numpy、pandas、Cython 等核心库正在适配，3.13 阶段部分可用，预计 3.14 基本完整

#### 3. 多进程（multiprocessing）
- No-GIL 不是多进程的替代品
- 多进程 IPC 开销大、数据隔离严格 → 适合完全隔离的任务
- No-GIL 多线程共享内存、开销低 → 适合需共享数据的 CPU 密集任务

### 五、迁移路线建议
| 阶段 | Python 版本 | 建议 |
| --- | --- | --- |
| 试验阶段 | 3.13 | 在开发环境测试，验证现有代码兼容性，不要上生产 |
| 评估阶段 | 3.14 | 核心生态基本跟上，开始把真正 CPU 密集的多进程代码评估迁移到多线程 |
| 生产阶段 | 3.15+ | 默认切换，利用真正多线程并行拿性能红利 |

迁移前**必须做**：审查所有多线程代码，所有共享可变对象都显式加锁（\`threading.Lock\`），即使在 GIL 模式下也这样写，未来无痛切换。
`,
      upvotes: 198,
    },
  ],
  [QIDS[7]]: [
    {
      author: AUTHOR_C,
      content: `## 为什么 forEach + await 不行？

### 先看 forEach 的实现（简化版）
\`\`\`js
function forEach(arr, callback) {
  for (let i = 0; i < arr.length; i++) {
    callback(arr[i], i, arr);   // ⚠️ 没有 await callback(...)
  }
}
\`\`\`

forEach 的回调里即使你加了 async，它也只是返回一个 Promise，而 forEach **根本不会等这个 Promise resolve**，直接进入下一次循环。三个回调瞬间全调用完，三个 fetch 同时发出去，自然就并发了。

这不是 await 的问题，是 forEach 的设计就是「同步遍历」，不考虑异步。

## 顺序执行的正确写法

### 1. 最简单：for...of（推荐）
\`\`\`js
const urls = ['/a', '/b', '/c'];
for (const url of urls) {
  const res = await fetch(url);    // 会真的等待前一个完成
  console.log(res.status);
}
\`\`\`
await 直接在外层 async 函数里，每一次迭代都会真正挂起等 Promise 完成。

### 2. for 循环 i++ 也可以（和 for...of 等价）
\`\`\`js
for (let i = 0; i < urls.length; i++) {
  await fetch(urls[i]);
}
\`\`\`

### 3. reduce 链式调用（写法比较优雅，阅读门槛高一点）
\`\`\`js
await urls.reduce(async (prevPromise, url) => {
  await prevPromise;       // 等前一个完成
  return fetch(url);       // 返回当前 Promise 给下一步
}, Promise.resolve());     // 初始值是一个已 resolve 的 Promise
\`\`\`

### 4. 顺序执行，但要收集所有结果
\`\`\`js
const results = [];
for (const url of urls) {
  results.push(await fetch(url));
}
\`\`\`

## 控制最大并发数（进阶）
如果有 100 个请求，不想全并发也不想全顺序，要控制并发为 3：
可以用 \`p-limit\` 库，或手写：
\`\`\`js
async function pool(urls, concurrency = 3) {
  const results = [];
  let idx = 0;
  async function worker() {
    while (idx < urls.length) {
      const i = idx++;
      results[i] = await fetch(urls[i]);
    }
  }
  await Promise.all(Array.from({length: concurrency}, () => worker()));
  return results;
}
\`\`\`
`,
      upvotes: 178,
    },
    {
      author: AUTHOR_B,
      content: `补充一个**容易搞错的点**：map + await 也不是顺序执行。

很多人以为：
\`\`\`js
const results = urls.map(async (url) => await fetch(url));
\`\`\`

但 map 和 forEach 一样，回调一调用就返回 Promise，不会等。所以：
- urls.map(async ...) 返回的是 **Promise 数组**，不是结果数组
- 这 N 个请求**同时并发**发出去了
- 要用 \`Promise.all(results)\` 才能拿到最终结果

所以：
| 写法 | 并发行为 | 最终拿到结果需要 |
| --- | --- | --- |
| forEach(async ...) | 并发 | 拿不到（forEach 返回 undefined） |
| map(async ...) | 并发 | Promise.all(promises) |
| for...of + await | **顺序** | 直接拿到（每次循环里赋值） |

还有一个不常用的 \`for await...of\`，它是用在**异步迭代器**（AsyncIterable）上的，不是普通数组：
\`\`\`js
// 异步生成器
async function* genUrls() {
  yield await fetch('/a');
  yield await fetch('/b');
}
// 消费
for await (const res of genUrls()) {
  console.log(res.status);  // 顺序拿到
}
\`\`\`
`,
      upvotes: 110,
    },
    {
      author: AUTHOR_AI,
      isAI: true,
      content: `## async/await 顺序执行：原理对比 + 4 种写法 + 并发控制

综合两位答主的内容，整理如下：

### 一、为什么 forEach + await 不行？
forEach 的本质是**同步遍历回调**，它内部没有 \`await\` 回调函数的返回值：

\`\`\`js
// forEach 内部实现（简化）
for (let i = 0; i < arr.length; i++) {
  callback(arr[i], i, arr);  // ← 没有 await！异步回调返回的 Promise 被直接丢弃
}
\`\`\`

结果：你在 callback 里写的 await 只在**回调函数内部**生效，forEach 外层不会等待，三个回调瞬间全执行，自然并发。

### 二、map + await 同样并发（不同点：能拿到 Promise 数组）
\`\`\`js
const promises = urls.map(async url => await fetch(url));
// ↑ 所有 fetch 已经并发发出，得到 Promise[]
const results = await Promise.all(promises);
// ↑ 用 Promise.all 等所有 Promise resolve，拿到最终结果
\`\`\`

### 三、顺序执行的 4 种写法

#### 1️⃣ for...of（最推荐，语义最清晰）
\`\`\`js
const results = [];
for (const url of urls) {
  const r = await fetch(url);   // 真·顺序等待
  results.push(await r.json());
}
\`\`\`

#### 2️⃣ 传统 for 循环（等价 for...of）
\`\`\`js
for (let i = 0; i < urls.length; i++) {
  await fetch(urls[i]);
}
\`\`\`

#### 3️⃣ reduce 链式（函数式写法）
\`\`\`js
await urls.reduce(async (chain, url) => {
  await chain;              // 等待前一个 Promise
  return fetch(url);        // 返回当前 Promise 给下一次 reduce
}, Promise.resolve());
\`\`\`

#### 4️⃣ 递归调用（老式写法，不推荐）
\`\`\`js
async function runSeq(i = 0) {
  if (i >= urls.length) return;
  await fetch(urls[i]);
  return runSeq(i + 1);
}
await runSeq();
\`\`\`

### 四、并发 vs 顺序 对比一览表

| 写法 | 并发模型 | 是否阻塞后续请求 | 适用场景 |
| --- | --- | --- | --- |
| urls.forEach(async (u) => await f(u)) | ❌ 全并发 | 否 | 不要用（无法追踪 Promise） |
| **Promise.all(urls.map(u => f(u)))** | ✅ 全并发 | 否 | 互相独立的请求，最快 |
| **for...of + await** | 🚦 严格顺序 | 是（等前一个完） | 有先后依赖的请求 |
| **p-limit(map, 3)** / 手写 pool | 🎚️ 可控并发 | 是（池满则等） | 100+ 请求，怕打满服务器 |

### 五、控制最大并发数（池模式）
如果 N 个请求，想限制同时最多 3 个在飞：

\`\`\`js
async function pooledFetch(urls, limit = 3) {
  const results = new Array(urls.length);
  let idx = 0;
  async function worker() {
    while (idx < urls.length) {
      const i = idx++;                // 原子地取下一个任务索引
      const r = await fetch(urls[i]);
      results[i] = await r.json();
    }
  }
  // 同时启动 limit 个 worker
  await Promise.all(Array.from({length: limit}, () => worker()));
  return results;
}
\`\`\`

工作原理：启动 3 个「工人」，每个工人从共享索引里抢 URL 处理，抢到后 await 等自己的完成，完成后再抢下一个。任意时刻最多 3 个请求在飞。
`,
      upvotes: 190,
    },
  ],
  [QIDS[8]]: [
    {
      author: AUTHOR_D,
      content: `## 一句话区分

**Flexbox 是一维布局（一条主轴），Grid 是二维布局（行+列同时控制）。**

一维 = 你一次只需要控制一个方向（横或纵）。
二维 = 你需要同时控制行和列两个方向上的排列。

## 适用场景对比

| 场景 | 推荐 Flexbox | 推荐 Grid |
| --- | --- | --- |
| 导航栏（一组按钮/链接横排） | ✅ | 杀鸡用牛刀 |
| 卡片列表，每行列数自适应 | 凑合（wrap，但对齐靠 gap） | ✅ \`grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))\` |
| 整体页面骨架：顶栏 + 侧边栏 + 主内容 + 底栏 | ❌（嵌套多层 Flex 太绕） | ✅ 一个 grid-template-areas 搞定 |
| 表单 label + input 两列对齐 | ❌ 要写各种宽度百分比 | ✅ \`grid-template-columns: 120px 1fr\` |
| 按钮组（主要+次要按钮横排） | ✅ | 太复杂 |
| 图片墙/瀑布流（元素高度不同） | ⚠️ 只能用 column-count 或者 Masonry 库 | ⚠️ Grid 需 masonry 提案（FF 已支持实验版） |
| 元素需要**跨行或跨列** | ❌ 做不到 | ✅ \`grid-column: span 2\` |

## 最经典的页面布局：Grid 外层 + Flex 内层
推荐的组合模式：
\`\`\`css
/* 外层：Grid 定骨架 */
.page {
  display: grid;
  grid-template-rows: 64px 1fr 48px;
  grid-template-columns: 240px 1fr;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  height: 100vh;
}
.header  { grid-area: header; display: flex; align-items: center; }
.sidebar { grid-area: sidebar; }
.main    { grid-area: main; padding: 24px; }
.footer  { grid-area: footer; }

/* 内层：Flex 处理单行组件 */
.header nav {
  display: flex;
  gap: 24px;
  align-items: center;
  margin-left: auto;
}
\`\`\`

**混合才是王道**：Grid 管整体骨架二维，Flex 管单行/单列一维。
`,
      upvotes: 165,
    },
    {
      author: AUTHOR_C,
      content: `补充两个实际案例代码，对比一下 Flex 和 Grid 写法的差异。

## 案例 1：响应式卡片网格

需求：卡片一行尽量多个，最小宽度 280px，自动换行并均分宽度。

### Flex 写法（很绕）
\`\`\`css
.card-container-flex {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.card-container-flex .card {
  flex: 1 1 280px;   /* grow=1 shrink=1 basis=280 */
  /* 问题：最后一行如果不足，卡片会被拉伸占满一行 */
  /* 解决方案：用 :after 伪元素占位，长度 = basis 但不 grow，非常 hack */
}
.card-container-flex::after {
  content: '';
  flex: 0 0 280px;
  visibility: hidden;
}
\`\`\`

### Grid 写法（超简洁，无 hack）
\`\`\`css
.card-container-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}
/* 搞定，最后一行自然左对齐不会拉伸 */
\`\`\`
> 注：auto-fill = 留空位，auto-fit = 拉伸卡片填满行。看需求选。

## 案例 2：表单两列对齐（label + input）

### Flex 写法（每个 label 都要手动设宽度）
\`\`\`css
.form-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
.form-row label {
  flex: 0 0 120px;   /* 固定宽度，且改一次所有 row 都改 */
  text-align: right;
  padding-right: 12px;
}
.form-row input {
  flex: 1;
}
\`\`\`
缺点：label 宽度每个 row 单独写，或者要统一写在外层 class。

### Grid 写法（全局列宽，一次设定）
\`\`\`css
.form-grid {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 12px 16px;   /* 行间距 列间距 */
  align-items: center;
}
.form-grid label { text-align: right; }
\`\`\`
优点：每一行的 label 自动对齐到最宽 label 的宽度（如果用 fit-content），整体更整齐。
`,
      upvotes: 108,
    },
    {
      author: AUTHOR_AI,
      isAI: true,
      content: `## CSS Grid vs Flexbox：选型决策树 + 典型代码

综合两位答主的回答，整理出完整的决策框架：

### 一、本质区别
- **Flexbox = 一维布局**：同一时刻只关心一个方向（主轴方向）上的排列，换行后每一行是独立的一行
- **Grid = 二维布局**：同时精确控制「行方向 + 列方向」，所有行和列构成完整网格，跨行/跨列是基础能力

### 二、选型决策树
\`\`\`
需要布局的内容是否是「多行多列的表格/网格结构」？
  ├─ 是 → 需要元素「跨行/跨列」吗？
  │         ├─ 是 → ✅ Grid（Flex 做不到）
  │         └─ 否 → 是「自适应列数的卡片网格」吗？
  │                   ├─ 是 → ✅ Grid（auto-fill/minmax 一行搞定，无 hack）
  │                   └─ 否 → 两者都行，Grid 更规范
  └─ 否 → 内容是「单行/单列，元素依次排列」？
            ├─ 是 → ✅ Flexbox（更简单、开销更低）
            └─ 否 → 内容是「整体页面骨架（header/sidebar/main/footer）」？
                      ├─ 是 → ✅ Grid（grid-template-areas 清晰直观）
                      └─ 否 → 两者皆可，按熟悉度选
\`\`\`

### 三、典型场景代码对照表

| 场景 | Flexbox 写法 | Grid 写法 | 推荐 |
| --- | --- | --- | --- |
| **导航栏按钮横排** | \`display:flex; gap:16px; align-items:center;\` | 杀鸡用牛刀 | Flex ✅ |
| **响应式卡片网格** | flex-wrap:wrap + ::after 占位 hack（复杂） | \`grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))\`（简洁） | Grid ✅ |
| **整体页面骨架** | 多层嵌套 Flex，语义差 | \`grid-template-areas:"H H" "S M" "F F"\`（直观） | Grid ✅ |
| **表单 label+input** | 每行列宽单独设置，DRY 差 | \`grid-template-columns: 120px 1fr\` 一次定义 | Grid ✅ |
| **按钮组（主次按钮）** | \`flex; gap:8px; align-items:center;\` | 过度设计 | Flex ✅ |
| **仪表盘（元素跨行跨列）** | 几乎做不到 | \`grid-column: span 2 / row: span 3\` 原生支持 | Grid ✅ |
| **相册瀑布流（不同高度）** | 依赖 CSS columns 或 JS Masonry | ⚠️ 需 masonry 实验性特性 | 都一般 |

### 四、推荐最佳实践：混合使用
最佳实践不是二选一，而是**Grid 做骨架 + Flex 做组件内布局**：

\`\`\`css
/* 外层 Grid：页面骨架 */
.app {
  display: grid;
  grid-template-rows: 64px 1fr;
  grid-template-columns: 240px 1fr;
  grid-template-areas:
    "nav   nav"
    "side  main";
  min-height: 100vh;
}
.nav   { grid-area: nav; }
.side  { grid-area: side; }
.main  { grid-area: main; }

/* 内层 Flex：导航栏按钮 */
.nav {
  display: flex;
  align-items: center;
  padding: 0 24px;
}
.nav .links {
  display: flex;
  gap: 24px;
  margin-left: auto;  /* 推到最右 */
}
\`\`\`

这样 Grid 和 Flexbox 各自做自己擅长的事，代码最清晰、维护性最好。

### 五、2024 兼容性
- Flexbox：所有现代浏览器 + IE11（少量坑）全支持
- Grid：Chrome 57+ / FF 52+ / Safari 10.1+ / Edge 16+ 全支持。**IE11 不支持**，但 2024 年已无需考虑
- 结论：新项目 Grid 大胆用，不要被旧资料吓到
`,
      upvotes: 175,
    },
  ],
  [QIDS[9]]: [
    {
      author: AUTHOR_A,
      content: `## 动态规划 DP 的通俗理解

DP 名字听起来很吓人，其实就是**把大问题拆成相同结构的子问题，子问题的答案存下来，避免重复计算**。

两个核心特征：
1. **最优子结构**：大问题的最优解可以由子问题的最优解组合出来
2. **重叠子问题**：同一个子问题会被计算很多次 → 所以要「记忆化」存结果

## 对比贪心算法
| 维度 | 动态规划 DP | 贪心 Greedy |
| --- | --- | --- |
| 选择策略 | **从子问题最优解回溯到全局**，每个阶段都考虑了「下一步选什么最优」，回溯过去所有可能 | **每步选当前看起来最好的局部最优**，不回头看，不考虑未来 |
| 能保证全局最优吗？ | ✅ 能（只要状态定义对） | ❌ 不一定（只有满足「贪心选择性质」才对） |
| 时间复杂度 | 通常 O(n²)、O(nk) 等，比暴力指数级好很多 | O(n) ~ O(n log n)，通常更快 |
| 决策依据 | 依赖所有子问题的解 | 只依赖当前一步的局部判断 |

## 同一个例子看区别：零钱兑换（LeetCode 322）

**题目**：硬币面额 [1, 3, 5]，凑 amount = 11，最少用多少枚硬币？

### 贪心算法（错解）
贪心 = 每一步选最大硬币：
- 11 → 选 5 → 剩 6
- 6 → 选 5 → 剩 1
- 1 → 选 1 → 剩 0
- 总共：5+5+1 = **3 枚** → 刚好对！

但换一个面额：硬币 [1, 3, 4]，凑 amount = 6。
贪心：选 4 → 剩 2 → 两个 1 → 共 3 枚（4+1+1）
实际最优：3+3 = **2 枚** ❌ 贪心错了！

### 动态规划（正解）
\`dp[i] = 凑出金额 i 的最少硬币数\`

递推：
\`dp[i] = min(dp[i - coin] + 1)\`，对每个面额的 coin。

dp[0] = 0
dp[1] = dp[0]+1 = 1 (1)
dp[2] = dp[1]+1 = 2 (1+1)
dp[3] = min(dp[2]+1, dp[0]+1) = min(3, 1) = 1 (3) ✅
dp[4] = min(dp[3]+1, dp[1]+1, dp[0]+1) = min(2, 2, 1) = 1 (4)
dp[5] = min(dp[4]+1, dp[2]+1, dp[1]+1) = min(2, 3, 2) = 2 (1+4 or 3+?...)
dp[6] = min(dp[5]+1, dp[3]+1, dp[2]+1) = min(3, **2**, 3) = **2** (3+3) ✅

DP 对所有可能的选择做了枚举（子问题），所以一定能找到全局最优。
`,
      upvotes: 205,
    },
    {
      author: AUTHOR_D,
      content: `补充一个**DP 五步法模板**，刷 DP 题按这个流程套，90% 入门题都能解决：

## DP 五步法
### Step 1：确定 dp[i] / dp[i][j] 的含义
先问自己：\`dp[i]\` 表示什么？用题目描述的语言把它说清楚，写在注释里。  
✅ 好的例子：dp[i] = 爬到第 i 级台阶的方法数  
❌ 坏的例子：dp[i] = 第 i 个的答案（太空泛）

### Step 2：写出状态转移方程
怎么从前面的 dp 值推导出 dp[i]？
- 找「到达当前状态的最后一步是什么」
- 对最后一步的所有可能取值**取 min / max / sum**

### Step 3：确定初始值（base case）
dp[0]、dp[1] 等最小情况是什么？直接写出来。

### Step 4：确定遍历顺序
- 一维：i 从 0 还是 1 开始，还是倒着遍历？
- 二维：先 i 还是先 j？背包问题还要区分 0/1 背包和完全背包

### Step 5：手算几步验证
举个小例子，按公式手动算 dp[0], dp[1], dp[2]... 两三步，看和直觉是否一致。

## 经典 5 道入门题（按难度排序）

| 难度 | 题目 | 类型 | 核心 dp 定义 |
| --- | --- | --- | --- |
| ⭐️ 入门 | LeetCode 70. 爬楼梯 | 线性 1D | dp[i] = 爬到第 i 阶的方法数 |
| ⭐️ 入门 | LeetCode 53. 最大子数组和 | 线性 1D | dp[i] = 以 i 结尾的最大子数组和 |
| ⭐️⭐️ 基础 | LeetCode 322. 零钱兑换 | 完全背包 1D | dp[i] = 凑出金额 i 的最少硬币数 |
| ⭐️⭐️ 基础 | LeetCode 300. 最长递增子序列 LIS | 线性 1D | dp[i] = 以 i 结尾的 LIS 长度 |
| ⭐️⭐️⭐️ 进阶 | LeetCode 1143. 最长公共子序列 LCS | 二维 2D | dp[i][j] = s1[0..i] 与 s2[0..j] 的 LCS 长度 |

每道题按五步法走一遍，DP 基本就入门了。
`,
      upvotes: 158,
    },
    {
      author: AUTHOR_AI,
      isAI: true,
      content: `## 动态规划 vs 贪心：核心区别 + 经典例题 + 解题模板

整合两位答主的内容，整理如下：

### 一、动态规划的本质
DP = **Divide & Conquer + Memoization**（分治 + 记忆化）

直觉理解：暴力递归会重复计算很多相同子问题 → DP 把子问题的答案存下来，下次同样的子问题直接查表，不用再算。

### 二、DP vs 贪心 核心区别对比

| 维度 | 动态规划 (DP) | 贪心算法 (Greedy) |
| --- | --- | --- |
| **决策视野** | 全局视野：基于**所有子问题的最优解**推导出当前最优 | 局部视野：每一步只选**当前看起来最好**的选项 |
| **最优性保证** | ✅ 保证全局最优（只要状态定义正确） | ❌ 不一定，需满足「贪心选择性质 + 最优子结构」才正确 |
| **回溯能力** | ✅ 有，可通过 dp 表回溯找到**具体方案**，而不仅是最优值 | ❌ 没有，做了选择就不回头 |
| **时间复杂度** | O(n²) / O(nk) / O(nm) 等，多项式级 | O(n) / O(n log n)，通常更快 |
| **空间复杂度** | 通常需要 O(n) 或 O(nm) 存 dp 表 | 通常 O(1)（可原地） |
| **典型反例** | — | 零钱兑换：[1,3,4] 凑 6 → 贪心 4+1+1=3 枚，实际 3+3=2 枚 |

### 三、零钱兑换例题：贪心失败 vs DP 成功
**题目**：硬币面额 \`[1, 3, 4]\`，凑 \`amount = 6\`，求最少硬币数。

#### ❌ 贪心解（错误）
每一步选最大可用 → 4 + 1 + 1 = **3 枚**

#### ✅ DP 解（正确）
定义：\`dp[i] = 凑出金额 i 的最少硬币数\`  
递推：\`dp[i] = min(dp[i - coin] + 1) for coin in coins if i >= coin\`  
初始：\`dp[0] = 0\`，其余设为 Infinity

\`\`\`
dp[0] = 0
dp[1] = dp[1-1] + 1 = 1           → 1
dp[2] = dp[2-1] + 1 = 2           → 1+1
dp[3] = min(dp[3-1]+1, dp[3-3]+1) = min(3, 1) = 1 → 3 ✅
dp[4] = min(dp[4-1]+1, dp[4-3]+1, dp[4-4]+1) = min(2, 2, 1) = 1 → 4
dp[5] = min(dp[5-1]+1, dp[5-3]+1, dp[5-4]+1) = min(2, 3, 2) = 2
dp[6] = min(dp[6-1]+1, dp[6-3]+1, dp[6-4]+1) = min(3, **2**, 3) = **2** ✅
\`\`\`
答案：3 + 3 = **2 枚**（贪心算法错在第一步选了 4，再也无法回退）

### 四、DP 五步法解题模板（答主 D 精华总结）
1. **定义 dp 含义**：用自然语言写清楚 \`dp[i]\` / \`dp[i][j]\` 表示什么（写在注释里！）
2. **状态转移方程**：从「最后一步的所有可能」归纳递推关系（取 min / max / sum）
3. **初始值 base case**：dp[0]、dp[0][j]、dp[i][0] 等最小情况直接写
4. **遍历顺序**：一维是正序还是倒序？二维先走 i 还是先走 j？（背包问题尤其关键）
5. **手算验证**：用一个小例子按公式算前 3~4 步，和直觉一致再写代码

### 五、经典 5 道 DP 入门题（按难度排序）

| 题号 | 题目名称 | 类型 | dp 定义 |
| --- | --- | --- | --- |
| LC 70 | 爬楼梯 🐣 | 线性 1D | \`dp[i] = 爬到第 i 阶的方法数\` |
| LC 53 | 最大子数组和 🐣 | 线性 1D | \`dp[i] = 以 i 结尾的最大子数组和\` |
| LC 322 | 零钱兑换 🐣🐣 | 完全背包 | \`dp[i] = 凑出金额 i 的最少硬币数\` |
| LC 300 | 最长递增子序列 LIS 🐣🐣 | 序列 1D | \`dp[i] = 以 i 结尾的 LIS 长度\` |
| LC 1143 | 最长公共子序列 LCS 🐣🐣🐣 | 二维序列 | \`dp[i][j] = s1[:i] 与 s2[:j] 的 LCS 长度\` |

### 六、快速判断该用 DP 还是贪心
- **能用贪心就用贪心**（速度快、代码短），但要**先想反例**：能不能造出局部最优导致全局非最优的例子？
- **找不到反例 → 可能贪心可以**，尝试证明（数学归纳法/交换论证）
- **能找到反例 → 老老实实用 DP**

经验法则：需要「选或不选」、「背包容量有限」、「状态之间会相互影响」的题，基本都是 DP。
`,
      upvotes: 220,
    },
  ],
};

function buildAnswers() {
  const answers = [];
  let idx = 0;
  const rotation = [AUTHOR_B, AUTHOR_C, AUTHOR_D];
  const authorAAppearIndexes = new Set([0, 5, 9]);

  for (let qi = 0; qi < QIDS.length; qi++) {
    const qid = QIDS[qi];
    const contentSet = answerContentsByQuestion[qid];
    if (!contentSet) continue;

    const humanAnswers = [];
    for (let ai = 0; ai < 2; ai++) {
      const entry = contentSet[ai];
      let author = entry.author;
      if (!author) {
        if (authorAAppearIndexes.has(qi) && ai === 0) {
          author = AUTHOR_A;
        } else {
          author = rotation[(qi + ai) % 3];
        }
      }
      const aid = `22222222-2222-4000-8000-${String(idx + 1).padStart(12, '0')}`;
      const ans = {
        id: aid,
        questionId: qid,
        authorId: author,
        content: entry.content,
        isAI: false,
        upvotes: entry.upvotes,
        status: 'published',
        createdAt: NOW - (40 - qi) * DAY_MS - ai * HOUR_MS,
        updatedAt: NOW - (40 - qi) * DAY_MS - ai * HOUR_MS + 600000,
      };
      answers.push(ans);
      humanAnswers.push(ans);
      idx++;
    }

    const aiEntry = contentSet[2];
    const aiAid = `22222222-2222-4000-8000-${String(idx + 1).padStart(12, '0')}`;
    answers.push({
      id: aiAid,
      questionId: qid,
      authorId: AUTHOR_AI,
      content: aiEntry.content,
      isAI: true,
      aiSourceAnswerIds: humanAnswers.map(a => a.id),
      upvotes: aiEntry.upvotes,
      status: 'published',
      createdAt: NOW - (40 - qi) * DAY_MS + HOUR_MS,
      updatedAt: NOW - (40 - qi) * DAY_MS + HOUR_MS + 600000,
    });
    idx++;
  }
  return answers;
}

const seedAnswers = buildAnswers();

function mapQidToAnswers(answers) {
  const m = new Map();
  for (const a of answers) {
    if (!m.has(a.questionId)) m.set(a.questionId, []);
    m.get(a.questionId).push(a);
  }
  return m;
}

const qidToAnswers = mapQidToAnswers(seedAnswers);

function buildSummaries() {
  const summaries = [];
  const targets = [
    {
      qid: QIDS[0],
      content: `## 核心结论
useEffect 重复执行最常见有三类原因，按优先级排查即可定位：**React 18 StrictMode 开发环境双调用**是最易忽略的来源，其次是**依赖数组中引用类型对象每次渲染新建**，以及**路由/第三方 Hook 返回值引用不稳定**[1][2]。

## 不同建议的分歧
答主 B 强调「Effect 清理函数要写对以抵消 StrictMode 双调用的副作用」，认为开发模式不应关 StrictMode，而应主动让副作用变纯净[1]。答主 C 补充了更具体的第三方 Hook 坑（react-router 的 useLocation/useParams 返回值引用变化），并提供了 Object.is 手动 diff 和 useWhyDidYouUpdate 调试技巧[2]。两者互补，前者是原则，后者是实操。

## 补充细节
所有 fetch Effect 都应加上「mounted 标记」或 AbortController 防止双调用+路由切换竞态导致的状态泄漏[1]。对象/数组用 useMemo、函数用 useCallback 稳定引用，JSX 内联写 \`prop={{a:1}}\` 是高频反例[1][2]。`,
    },
    {
      qid: QIDS[1],
      content: `## 核心结论
Python 并发选型的判断逻辑是：**GIL 只在执行 Python 字节码时才是瓶颈，IO 等待时会主动释放** → CPU 密集型必须用多进程破 GIL，IO 密集型用多线程/asyncio 开销更低[1][2]。

## 不同建议的分歧
答主 C 偏向从原理层面讲透 GIL 释放时机和 multiprocessing 的 IPC 代价[1]；答主 D 则给出了可直接运行的对比代码（单线程/多线程/多进程跑同一 cpu_work）和 \`os.cpu_count()\` 进程数上限建议[2]。前者解决「为什么」，后者解决「怎么验证」，结合使用效果最佳。

## 补充细节
实际选型时 C 扩展也需注意：numpy/pandas 内部计算时会主动释放 GIL，这类代码多线程也能拿到并行加速[1]。Windows 多进程必须把入口包在 \`if __name__ == '__main__'\` 内，大数据跨进程可用 shared_memory 减少 pickle 开销[1]。`,
    },
    {
      qid: QIDS[2],
      content: `## 核心结论
浏览器事件循环的顺序可概括为一句话循环：**「同步代码执行完（Call Stack 空）→ 一次性清空全部 Microtask → 取一个 Macrotask 执行 → 回到清空 Microtask...」**，其中 await 之后的代码属于 Microtask，不能误认为是同步代码[1][2]。

## 不同建议的分歧
答主 B 给出了最完整的嵌套例题（setTimeout 内再塞 Promise、Promise.then 内再塞 setTimeout），逐步推演得到 1→6→4→2→3→5 的输出结果[1]。答主 D 补充了 await 等价转换的等价关系（await 之后代码等价于 Promise.then 回调）以及 Node.js 环境下 process.nextTick/setImmediate 的额外优先级，但明确说明浏览器环境不适用[2]。

## 补充细节
同一轮 Microtask 清空过程中，新入队的 Microtask 也会在同轮继续执行（不会延后到下一轮），这是常被忽略的特性[1]。setTimeout(fn, 0) 的实际最小延迟为 4ms（HTML 规范嵌套≥5 层时），面试时作为加分点可提[2]。`,
    },
  ];

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    const relatedAnswers = qidToAnswers.get(t.qid) || [];
    const nonAI = relatedAnswers.filter(a => !a.isAI);
    const sourceIds = nonAI.map(a => a.id);
    const citations = sourceIds.map((aid, idx) => {
      const ans = relatedAnswers.find(x => x.id === aid) || nonAI[idx];
      const snippet = ans.content.slice(0, 60);
      return {
        index: idx + 1,
        answerId: aid,
        snippet,
      };
    });

    summaries.push({
      id: `33333333-3333-4000-8000-${String(i + 1).padStart(12, '0')}`,
      questionId: t.qid,
      content: t.content,
      sourceAnswerIds: sourceIds,
      citations,
      status: 'stable',
      generatedAt: NOW - (8 + i) * DAY_MS,
      updatedAt: NOW - (8 + i) * DAY_MS,
      feedbackCount: {
        helpful: 4 + i * 3,
        needsUpdate: i % 2,
        inaccurate: i === 2 ? 1 : 0,
      },
    });
  }
  return summaries;
}

const seedSummaries = buildSummaries();

export { seedQuestions, seedAnswers, seedSummaries };
