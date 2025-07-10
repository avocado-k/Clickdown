# TypeScript 개념 정리

## 1. TypeScript란?
TypeScript는 JavaScript의 상위 집합(superset)으로, JavaScript에 정적 타입 시스템을 추가한 언어입니다.

## 2. 기본 타입 시스템

### 2.1 원시 타입
```typescript
let name: string = "John";
let age: number = 25;
let isStudent: boolean = true;
let nothing: null = null;
let notDefined: undefined = undefined;
```

### 2.2 배열과 객체
```typescript
// 배열
let numbers: number[] = [1, 2, 3];
let strings: Array<string> = ["a", "b", "c"];

// 객체
let user: { name: string; age: number } = {
  name: "John",
  age: 25
};
```

## 3. 인터페이스 (Interface)
객체의 구조를 정의하는 방법입니다.

```typescript
interface User {
  name: string;
  age: number;
  email?: string; // 선택적 프로퍼티
}

interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}
```

**프로젝트에서 사용 예시:**
```typescript
// client/src/utils/api.ts:5-9
interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}
```

## 4. 제네릭 (Generics)
타입을 매개변수로 사용하여 재사용 가능한 컴포넌트를 만드는 방법입니다.

```typescript
// 제네릭 함수
function identity<T>(arg: T): T {
  return arg;
}

// 제네릭 클래스
class GenericClass<T> {
  private data: T;
  
  constructor(data: T) {
    this.data = data;
  }
  
  getData(): T {
    return this.data;
  }
}
```

**프로젝트에서 사용 예시:**
```typescript
// client/src/utils/api.ts:18-21
private async request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>>
```

## 5. 클래스 (Class)
객체지향 프로그래밍의 기본 단위입니다.

```typescript
class Person {
  private name: string;
  protected age: number;
  public email: string;
  
  constructor(name: string, age: number, email: string) {
    this.name = name;
    this.age = age;
    this.email = email;
  }
  
  public getName(): string {
    return this.name;
  }
  
  protected getAge(): number {
    return this.age;
  }
}
```

**프로젝트에서 사용 예시:**
```typescript
// client/src/utils/api.ts:11-16
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
}
```

## 6. 접근 제어자 (Access Modifiers)
- `public`: 어디서든 접근 가능 (기본값)
- `private`: 클래스 내부에서만 접근 가능
- `protected`: 클래스와 상속받은 클래스에서 접근 가능

## 7. 비동기 프로그래밍 (Async/Await)
```typescript
async function fetchData(): Promise<string> {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error('데이터를 가져오는데 실패했습니다');
  }
}
```

**프로젝트에서 사용 예시:**
```typescript
// client/src/utils/api.ts:18-68
private async request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // ... 비동기 HTTP 요청 처리
}
```

## 8. 타입 가드 (Type Guards)
런타임에서 타입을 확인하는 방법입니다.

```typescript
function isString(value: any): value is string {
  return typeof value === 'string';
}

// 사용
if (isString(someValue)) {
  // 여기서 someValue는 string 타입으로 추론됩니다
  console.log(someValue.toUpperCase());
}
```

**프로젝트에서 사용 예시:**
```typescript
// client/src/utils/api.ts:63-66
return { 
  error: error instanceof Error ? error.message : 'Unknown error' 
};
```

## 9. 유틸리티 타입
TypeScript에서 제공하는 유용한 타입들입니다.

```typescript
// Partial: 모든 프로퍼티를 선택적으로 만듦
type PartialUser = Partial<User>;

// Required: 모든 프로퍼티를 필수로 만듦
type RequiredUser = Required<User>;

// Pick: 특정 프로퍼티만 선택
type UserName = Pick<User, 'name'>;

// Omit: 특정 프로퍼티를 제외
type UserWithoutAge = Omit<User, 'age'>;
```

## 10. 타입 선언 (Type Declarations)
기존 JavaScript 라이브러리에 타입 정보를 추가하는 방법입니다.

```typescript
// types/global.d.ts
declare global {
  interface Window {
    customProperty: string;
  }
}

// 모듈 선언
declare module 'some-library' {
  export function someFunction(): void;
}
```

## 11. 컴파일러 옵션 (tsconfig.json)
TypeScript 컴파일러의 동작을 제어하는 설정 파일입니다.

**프로젝트에서 사용 예시:**
```json
// client/tsconfig.json
{
  "compilerOptions": {
    "target": "es5",
    "strict": true,
    "esModuleInterop": true,
    "jsx": "preserve",
    "moduleResolution": "node"
  }
}
```

## 12. 타입 단언 (Type Assertion)
개발자가 타입을 명시적으로 지정하는 방법입니다.

```typescript
// as 키워드 사용
let someValue: any = "hello";
let strLength: number = (someValue as string).length;

// 꺾쇠 괄호 사용
let strLength2: number = (<string>someValue).length;
```

## 13. 열거형 (Enum)
관련된 상수들을 그룹화하는 방법입니다.

```typescript
enum Color {
  Red,
  Green,
  Blue
}

enum Status {
  Pending = "pending",
  Completed = "completed",
  Failed = "failed"
}
```

## 14. 네임스페이스 (Namespace)
코드를 논리적으로 그룹화하는 방법입니다.

```typescript
namespace Utils {
  export function formatDate(date: Date): string {
    return date.toISOString();
  }
  
  export function isValidEmail(email: string): boolean {
    return email.includes('@');
  }
}

// 사용
Utils.formatDate(new Date());
```

## 15. 모듈 시스템
TypeScript는 ES6 모듈 시스템을 지원합니다.

```typescript
// export
export interface User {
  name: string;
  age: number;
}

export default class ApiClient {
  // ...
}

// import
import ApiClient, { User } from './api';
```

**프로젝트에서 사용 예시:**
```typescript
// client/src/utils/api.ts:193-194
export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
```

## 16. 실용적인 팁

### 16.1 타입 추론 활용
```typescript
// 타입을 명시하지 않아도 TypeScript가 추론
const name = "John"; // string으로 추론
const age = 25; // number로 추론
```

### 16.2 옵셔널 체이닝과 널 병합
```typescript
// 옵셔널 체이닝
const user = getUser();
const email = user?.profile?.email;

// 널 병합
const name = user?.name ?? "Unknown";
```

### 16.3 타입 가드 사용
```typescript
if (error instanceof Error) {
  console.log(error.message);
} else {
  console.log("Unknown error");
}
```

이러한 TypeScript 개념들은 프로젝트에서 타입 안전성을 제공하고, 개발 시 더 나은 IDE 지원과 컴파일 타임 에러 체크를 가능하게 합니다.