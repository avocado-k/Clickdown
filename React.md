# React 개념 정리

## 1. React란?
React는 Facebook에서 개발한 JavaScript 라이브러리로, 사용자 인터페이스(UI)를 구축하기 위해 사용됩니다. 컴포넌트 기반 아키텍처를 사용하여 재사용 가능한 UI 요소를 만들 수 있습니다.

## 2. 컴포넌트 (Components)

### 2.1 함수형 컴포넌트
```jsx
// 기본 함수형 컴포넌트
function Welcome(props) {
  return <h1>Hello, {props.name}!</h1>;
}

// 화살표 함수로 작성
const Welcome = (props) => {
  return <h1>Hello, {props.name}!</h1>;
};

// 간단한 형태
const Welcome = ({ name }) => <h1>Hello, {name}!</h1>;
```

**프로젝트에서 사용 예시:**
```jsx
// client/src/pages/index.tsx:5
export default function Home() {
  // 컴포넌트 로직
}
```

### 2.2 Props
Props는 부모 컴포넌트에서 자식 컴포넌트로 데이터를 전달하는 방법입니다.

```jsx
// 부모 컴포넌트
function App() {
  return <Welcome name="Sara" />;
}

// 자식 컴포넌트
function Welcome(props) {
  return <h1>Hello, {props.name}!</h1>;
}
```

**프로젝트에서 사용 예시:**
```jsx
// client/src/components/Layout.tsx:5-7
interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  // children은 props로 전달받은 내용
}
```

## 3. State와 useState Hook

### 3.1 State 개념
State는 컴포넌트의 상태를 나타내는 데이터입니다. State가 변경되면 컴포넌트가 다시 렌더링됩니다.

### 3.2 useState Hook
```jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
```

**프로젝트에서 사용 예시:**
```jsx
// client/src/pages/login.tsx:8-11
const [formData, setFormData] = useState({
  email: '',
  password: ''
});
```

### 3.3 복잡한 State 관리
```jsx
// 객체 형태의 State
const [user, setUser] = useState({
  name: '',
  email: '',
  age: 0
});

// State 업데이트 (스프레드 연산자 사용)
setUser({
  ...user,
  name: 'John'
});
```

## 4. useEffect Hook
useEffect는 함수형 컴포넌트에서 사이드 이펙트를 처리하는 Hook입니다.

### 4.1 기본 사용법
```jsx
import { useEffect } from 'react';

function Example() {
  useEffect(() => {
    // 컴포넌트가 마운트될 때 실행
    console.log('Component mounted');
  }, []); // 빈 배열 = 한 번만 실행

  return <div>Hello</div>;
}
```

**프로젝트에서 사용 예시:**
```jsx
// client/src/pages/dashboard.tsx:17-19
useEffect(() => {
  fetchData()
}, [])
```

### 4.2 의존성 배열
```jsx
// 의존성 배열에 따른 실행 시점
useEffect(() => {
  // 컴포넌트가 렌더링될 때마다 실행
});

useEffect(() => {
  // 컴포넌트가 마운트될 때 한 번만 실행
}, []);

useEffect(() => {
  // count가 변경될 때마다 실행
}, [count]);
```

### 4.3 cleanup 함수
```jsx
useEffect(() => {
  const timer = setInterval(() => {
    console.log('Timer tick');
  }, 1000);

  // cleanup 함수 (컴포넌트가 언마운트될 때 실행)
  return () => {
    clearInterval(timer);
  };
}, []);
```

## 5. 이벤트 처리

### 5.1 이벤트 핸들러
```jsx
function Button() {
  const handleClick = (e) => {
    e.preventDefault(); // 기본 동작 방지
    console.log('Button clicked');
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

**프로젝트에서 사용 예시:**
```jsx
// client/src/pages/login.tsx:16-48
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault(); // 폼 기본 제출 방지
  // 로그인 로직
};
```

### 5.2 폼 처리
```jsx
function Form() {
  const [value, setValue] = useState('');

  const handleChange = (e) => {
    setValue(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitted:', value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={value} onChange={handleChange} />
      <button type="submit">Submit</button>
    </form>
  );
}
```

## 6. 조건부 렌더링
JSX에서 조건에 따라 다른 내용을 렌더링하는 방법입니다.

### 6.1 if 문 사용
```jsx
function Greeting({ isLoggedIn }) {
  if (isLoggedIn) {
    return <h1>Welcome back!</h1>;
  }
  return <h1>Please sign up.</h1>;
}
```

### 6.2 삼항 연산자
```jsx
function Greeting({ isLoggedIn }) {
  return (
    <div>
      {isLoggedIn ? <h1>Welcome back!</h1> : <h1>Please sign up.</h1>}
    </div>
  );
}
```

**프로젝트에서 사용 예시:**
```jsx
// client/src/pages/dashboard.tsx:183-185
{tasks.length === 0 ? (
  <p className="text-gray-500 text-center py-8">No tasks yet. Create your first task!</p>
) : (
  // 태스크 목록 렌더링
)}
```

### 6.3 논리 AND 연산자
```jsx
function Mailbox({ unreadMessages }) {
  return (
    <div>
      <h1>Hello!</h1>
      {unreadMessages.length > 0 && (
        <h2>You have {unreadMessages.length} unread messages.</h2>
      )}
    </div>
  );
}
```

## 7. 리스트 렌더링

### 7.1 map 함수 사용
```jsx
function NumberList({ numbers }) {
  return (
    <ul>
      {numbers.map((number) => (
        <li key={number}>{number}</li>
      ))}
    </ul>
  );
}
```

**프로젝트에서 사용 예시:**
```jsx
// client/src/pages/dashboard.tsx:187-206
{tasks.slice(0, 5).map((task: any) => (
  <div key={task.id} className="...">
    <h3>{task.title}</h3>
    <p>{task.project?.name}</p>
  </div>
))}
```

### 7.2 key prop의 중요성
```jsx
// 좋은 예: 고유한 ID 사용
{items.map((item) => (
  <div key={item.id}>{item.name}</div>
))}

// 나쁜 예: 배열 인덱스 사용
{items.map((item, index) => (
  <div key={index}>{item.name}</div>
))}
```

## 8. JSX (JavaScript XML)

### 8.1 JSX 기본 문법
```jsx
// JSX 표현식
const element = <h1>Hello, world!</h1>;

// JavaScript 표현식 삽입
const name = 'Josh Perez';
const element = <h1>Hello, {name}</h1>;

// 속성 사용
const element = <div className="container">Content</div>;
```

### 8.2 JSX 규칙
- 반드시 하나의 루트 요소로 감싸야 함 (또는 Fragment 사용)
- 모든 태그는 닫혀야 함
- className, htmlFor 등 카멜케이스 사용

```jsx
// Fragment 사용
return (
  <>
    <h1>Title</h1>
    <p>Content</p>
  </>
);

// 또는 React.Fragment
return (
  <React.Fragment>
    <h1>Title</h1>
    <p>Content</p>
  </React.Fragment>
);
```

## 9. 컴포넌트 라이프사이클

### 9.1 마운트 (Mount)
컴포넌트가 처음 DOM에 삽입될 때 발생합니다.

```jsx
useEffect(() => {
  // 컴포넌트 마운트 시 실행
  console.log('Component mounted');
}, []);
```

### 9.2 업데이트 (Update)
State나 Props가 변경될 때 발생합니다.

```jsx
useEffect(() => {
  // count가 변경될 때마다 실행
  console.log('Count updated:', count);
}, [count]);
```

### 9.3 언마운트 (Unmount)
컴포넌트가 DOM에서 제거될 때 발생합니다.

```jsx
useEffect(() => {
  return () => {
    // 컴포넌트 언마운트 시 실행
    console.log('Component unmounted');
  };
}, []);
```

## 10. React Router (Next.js에서는 내장 라우터)

### 10.1 Next.js 라우터 사용
```jsx
import { useRouter } from 'next/router';

function MyComponent() {
  const router = useRouter();

  const handleClick = () => {
    router.push('/dashboard');
  };

  return <button onClick={handleClick}>Go to Dashboard</button>;
}
```

**프로젝트에서 사용 예시:**
```jsx
// client/src/pages/login.tsx:37
router.push('/dashboard');
```

### 10.2 Link 컴포넌트
```jsx
import Link from 'next/link';

function Navigation() {
  return (
    <nav>
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/tasks">Tasks</Link>
    </nav>
  );
}
```

## 11. 스타일링

### 11.1 CSS 클래스 사용
```jsx
// Tailwind CSS 사용 예시
function Button() {
  return (
    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
      Click me
    </button>
  );
}
```

### 11.2 인라인 스타일
```jsx
function Component() {
  const style = {
    backgroundColor: 'blue',
    color: 'white',
    padding: '10px'
  };

  return <div style={style}>Styled content</div>;
}
```

**프로젝트에서 사용 예시:**
```jsx
// client/src/pages/dashboard.tsx:231
<div 
  className="w-3 h-3 rounded-full mr-2" 
  style={{ backgroundColor: project.color }}
></div>
```

## 12. 폼 처리

### 12.1 제어 컴포넌트 (Controlled Components)
```jsx
function ControlledInput() {
  const [value, setValue] = useState('');

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}
```

### 12.2 비제어 컴포넌트 (Uncontrolled Components)
```jsx
function UncontrolledInput() {
  const inputRef = useRef(null);

  const handleSubmit = () => {
    console.log(inputRef.current.value);
  };

  return (
    <input
      type="text"
      ref={inputRef}
    />
  );
}
```

## 13. 에러 처리

### 13.1 try-catch 사용
```jsx
function DataComponent() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      {error && <p>Error: {error}</p>}
      {data && <p>Data: {data}</p>}
    </div>
  );
}
```

## 14. 커스텀 Hook
재사용 가능한 로직을 커스텀 Hook으로 분리할 수 있습니다.

```jsx
// useCounter 커스텀 Hook
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);

  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);
  const reset = () => setCount(initialValue);

  return { count, increment, decrement, reset };
}

// 사용
function Counter() {
  const { count, increment, decrement, reset } = useCounter(10);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

## 15. 성능 최적화

### 15.1 React.memo
```jsx
import { memo } from 'react';

const ExpensiveComponent = memo(({ data }) => {
  // 복잡한 계산
  return <div>{data}</div>;
});
```

### 15.2 useMemo
```jsx
import { useMemo } from 'react';

function ExpensiveCalculation({ items }) {
  const expensiveValue = useMemo(() => {
    return items.reduce((sum, item) => sum + item.value, 0);
  }, [items]);

  return <div>{expensiveValue}</div>;
}
```

### 15.3 useCallback
```jsx
import { useCallback } from 'react';

function Parent({ items }) {
  const handleClick = useCallback((id) => {
    // 클릭 핸들러
  }, []);

  return (
    <div>
      {items.map(item => (
        <Child key={item.id} onClick={handleClick} />
      ))}
    </div>
  );
}
```

## 16. 실용적인 팁

### 16.1 조건부 클래스 이름
```jsx
function Button({ isActive }) {
  const className = `button ${isActive ? 'active' : 'inactive'}`;
  
  return <button className={className}>Click me</button>;
}
```

### 16.2 환경 변수 사용
```jsx
// Next.js에서 환경 변수 사용
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

### 16.3 타입 안전성 (TypeScript)
```tsx
interface User {
  id: number;
  name: string;
  email: string;
}

function UserProfile({ user }: { user: User }) {
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

이러한 React 개념들은 프로젝트에서 사용자 인터페이스를 구축하고, 상태를 관리하며, 사용자 상호작용을 처리하는 데 필수적입니다. 각 개념을 프로젝트의 실제 코드 예시와 함께 학습하면 더 쉽게 이해할 수 있습니다.