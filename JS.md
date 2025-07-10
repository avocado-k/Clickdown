# JavaScript 개념 정리

## 1. JavaScript란?
JavaScript는 웹 브라우저에서 동작하는 스크립트 언어로, 현재는 서버사이드(Node.js)에서도 사용됩니다.

## 2. 변수와 데이터 타입

### 2.1 변수 선언
```javascript
var oldWay = "예전 방식"; // 함수 스코프
let modernWay = "현대적 방식"; // 블록 스코프
const constant = "상수"; // 변경 불가능한 값
```

### 2.2 데이터 타입
```javascript
// 원시 타입
let name = "John"; // string
let age = 25; // number
let isStudent = true; // boolean
let nothing = null; // null
let notDefined = undefined; // undefined
let symbol = Symbol("id"); // symbol
let bigInt = 123n; // bigint

// 참조 타입
let obj = { name: "John", age: 25 }; // object
let arr = [1, 2, 3]; // array
let func = function() {}; // function
```

## 3. 함수 (Functions)

### 3.1 함수 선언 방식
```javascript
// 함수 선언문
function greet(name) {
  return `Hello, ${name}!`;
}

// 함수 표현식
const greet2 = function(name) {
  return `Hello, ${name}!`;
};

// 화살표 함수
const greet3 = (name) => {
  return `Hello, ${name}!`;
};

// 화살표 함수 (단축형)
const greet4 = name => `Hello, ${name}!`;
```

**프로젝트에서 사용 예시:**
```javascript
// server/src/utils/auth.js:4-8
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};
```

### 3.2 고차 함수 (Higher-Order Functions)
```javascript
// 함수를 인수로 받는 함수
function processArray(arr, callback) {
  return arr.map(callback);
}

// 함수를 반환하는 함수
function createMultiplier(multiplier) {
  return function(number) {
    return number * multiplier;
  };
}
```

## 4. 객체와 배열

### 4.1 객체 (Object)
```javascript
// 객체 생성
const person = {
  name: "John",
  age: 25,
  greet: function() {
    console.log(`Hello, I'm ${this.name}`);
  }
};

// 객체 접근
console.log(person.name); // 점 표기법
console.log(person["age"]); // 대괄호 표기법
```

### 4.2 배열 (Array)
```javascript
const numbers = [1, 2, 3, 4, 5];

// 배열 메서드
numbers.push(6); // 끝에 추가
numbers.pop(); // 끝에서 제거
numbers.shift(); // 처음에서 제거
numbers.unshift(0); // 처음에 추가

// 고차 함수 메서드
const doubled = numbers.map(n => n * 2);
const evens = numbers.filter(n => n % 2 === 0);
const sum = numbers.reduce((acc, n) => acc + n, 0);
```

## 5. 스코프와 클로저

### 5.1 스코프 (Scope)
```javascript
// 전역 스코프
var globalVar = "전역 변수";

function outerFunction() {
  // 함수 스코프
  var outerVar = "외부 변수";
  
  function innerFunction() {
    // 내부 스코프
    var innerVar = "내부 변수";
    console.log(globalVar); // 접근 가능
    console.log(outerVar); // 접근 가능
    console.log(innerVar); // 접근 가능
  }
  
  console.log(innerVar); // 에러! 접근 불가능
}
```

### 5.2 클로저 (Closure)
```javascript
function createCounter() {
  let count = 0;
  
  return function() {
    count++;
    return count;
  };
}

const counter = createCounter();
console.log(counter()); // 1
console.log(counter()); // 2
```

## 6. 비동기 프로그래밍

### 6.1 콜백 (Callback)
```javascript
function fetchData(callback) {
  setTimeout(() => {
    callback(null, "데이터");
  }, 1000);
}

fetchData((error, data) => {
  if (error) {
    console.log("에러:", error);
  } else {
    console.log("데이터:", data);
  }
});
```

### 6.2 Promise
```javascript
// Promise 생성
const fetchData = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve("데이터");
    }, 1000);
  });
};

// Promise 사용
fetchData()
  .then(data => console.log(data))
  .catch(error => console.log(error));
```

### 6.3 async/await
```javascript
async function fetchDataAsync() {
  try {
    const data = await fetchData();
    console.log(data);
  } catch (error) {
    console.log("에러:", error);
  }
}
```

**프로젝트에서 사용 예시:**
```javascript
// server/src/utils/auth.js:10-12
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};
```

## 7. 프로토타입과 상속

### 7.1 프로토타입 (Prototype)
```javascript
function Person(name) {
  this.name = name;
}

Person.prototype.greet = function() {
  console.log(`Hello, I'm ${this.name}`);
};

const john = new Person("John");
john.greet(); // "Hello, I'm John"
```

### 7.2 클래스 (ES6+)
```javascript
class Person {
  constructor(name) {
    this.name = name;
  }
  
  greet() {
    console.log(`Hello, I'm ${this.name}`);
  }
}

class Student extends Person {
  constructor(name, grade) {
    super(name);
    this.grade = grade;
  }
  
  study() {
    console.log(`${this.name} is studying`);
  }
}
```

## 8. 모듈 시스템

### 8.1 CommonJS (Node.js)
```javascript
// 내보내기
module.exports = {
  generateToken,
  hashPassword,
  comparePasswords
};

// 또는
exports.generateToken = generateToken;

// 가져오기
const { generateToken } = require('./auth');
```

**프로젝트에서 사용 예시:**
```javascript
// server/src/utils/auth.js:18-22
module.exports = {
  generateToken,
  hashPassword,
  comparePasswords
};
```

### 8.2 ES6 모듈
```javascript
// 내보내기
export const generateToken = (userId) => {
  // ...
};

export default class ApiClient {
  // ...
}

// 가져오기
import ApiClient, { generateToken } from './api';
```

## 9. 이벤트 처리

### 9.1 이벤트 리스너
```javascript
// 이벤트 리스너 추가
document.addEventListener('click', function(event) {
  console.log('클릭됨!', event.target);
});

// 화살표 함수 사용
button.addEventListener('click', (event) => {
  console.log('버튼 클릭됨!');
});
```

### 9.2 이벤트 위임
```javascript
// 부모 요소에 이벤트 리스너 추가
document.addEventListener('click', function(event) {
  if (event.target.classList.contains('button')) {
    console.log('버튼이 클릭됨!');
  }
});
```

## 10. 에러 처리

### 10.1 try-catch
```javascript
try {
  // 위험한 코드
  const data = JSON.parse(jsonString);
  console.log(data);
} catch (error) {
  console.log('에러 발생:', error.message);
} finally {
  console.log('항상 실행됨');
}
```

**프로젝트에서 사용 예시:**
```javascript
// server/src/utils/logger.js:143-148
if (error) {
  logger.error('Database Error', { ...logData, error: error.message });
} else {
  logger.debug('Database Query', logData);
}
```

### 10.2 에러 던지기
```javascript
function divide(a, b) {
  if (b === 0) {
    throw new Error('0으로 나눌 수 없습니다');
  }
  return a / b;
}
```

## 11. 구조분해할당 (Destructuring)

### 11.1 배열 구조분해할당
```javascript
const arr = [1, 2, 3];
const [first, second, third] = arr;
console.log(first); // 1
```

### 11.2 객체 구조분해할당
```javascript
const person = { name: "John", age: 25 };
const { name, age } = person;
console.log(name); // "John"

// 다른 이름으로 할당
const { name: personName, age: personAge } = person;
```

**프로젝트에서 사용 예시:**
```javascript
// server/src/utils/logger.js:24
const { timestamp, level, message, stack, ...meta } = logInfo;
```

## 12. 스프레드 연산자와 나머지 매개변수

### 12.1 스프레드 연산자
```javascript
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
const combined = [...arr1, ...arr2]; // [1, 2, 3, 4, 5, 6]

const obj1 = { a: 1, b: 2 };
const obj2 = { c: 3, d: 4 };
const combined2 = { ...obj1, ...obj2 }; // { a: 1, b: 2, c: 3, d: 4 }
```

### 12.2 나머지 매개변수
```javascript
function sum(...numbers) {
  return numbers.reduce((acc, num) => acc + num, 0);
}

sum(1, 2, 3, 4); // 10
```

## 13. 템플릿 리터럴
```javascript
const name = "John";
const age = 25;

// 템플릿 리터럴 사용
const message = `Hello, my name is ${name} and I'm ${age} years old.`;

// 여러 줄 문자열
const multiLine = `
  This is
  a multi-line
  string
`;
```

## 14. 정규식 (Regular Expressions)
```javascript
const email = "user@example.com";
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (emailRegex.test(email)) {
  console.log("유효한 이메일");
}

// 문자열 메서드와 함께 사용
const text = "Hello World";
const replaced = text.replace(/Hello/, "Hi"); // "Hi World"
```

## 15. 배열과 객체의 고급 메서드

### 15.1 배열 메서드
```javascript
const numbers = [1, 2, 3, 4, 5];

// find: 조건에 맞는 첫 번째 요소 찾기
const found = numbers.find(n => n > 3); // 4

// findIndex: 조건에 맞는 첫 번째 요소의 인덱스 찾기
const index = numbers.findIndex(n => n > 3); // 3

// some: 하나라도 조건에 맞으면 true
const hasEven = numbers.some(n => n % 2 === 0); // true

// every: 모든 요소가 조건에 맞으면 true
const allPositive = numbers.every(n => n > 0); // true

// includes: 요소가 포함되어 있는지 확인
const hasThree = numbers.includes(3); // true
```

### 15.2 객체 메서드
```javascript
const person = { name: "John", age: 25, city: "Seoul" };

// Object.keys: 키 배열 반환
const keys = Object.keys(person); // ["name", "age", "city"]

// Object.values: 값 배열 반환
const values = Object.values(person); // ["John", 25, "Seoul"]

// Object.entries: [키, 값] 배열 반환
const entries = Object.entries(person); // [["name", "John"], ["age", 25], ["city", "Seoul"]]
```

## 16. 실용적인 팁

### 16.1 디버깅
```javascript
// console 메서드 활용
console.log("기본 로그");
console.error("에러 로그");
console.warn("경고 로그");
console.info("정보 로그");
console.table(arrayData); // 테이블 형태로 출력
```

**프로젝트에서 사용 예시:**
```javascript
// server/src/utils/logger.js:96-151
const log = {
  error: (message, meta = {}) => {
    logger.error(message, meta);
  },
  warn: (message, meta = {}) => {
    logger.warn(message, meta);
  },
  info: (message, meta = {}) => {
    logger.info(message, meta);
  }
};
```

### 16.2 성능 최적화
```javascript
// 조건부 실행
const result = condition && expensiveOperation();

// 기본값 설정
const name = user.name || "Unknown";
const age = user.age ?? 0; // null 병합 연산자

// 메모이제이션
const memoize = (fn) => {
  const cache = {};
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache[key]) {
      return cache[key];
    }
    const result = fn(...args);
    cache[key] = result;
    return result;
  };
};
```

### 16.3 유용한 패턴
```javascript
// IIFE (즉시 실행 함수)
(function() {
  // 지역 스코프에서 실행
  const privateVar = "비공개";
})();

// 모듈 패턴
const myModule = (function() {
  let privateVar = 0;
  
  return {
    increment: () => privateVar++,
    getCount: () => privateVar
  };
})();
```

이러한 JavaScript 개념들은 프로젝트의 서버사이드 코드에서 핵심적으로 사용되며, 비동기 처리, 모듈 시스템, 에러 처리 등의 패턴을 이해하는 데 도움이 됩니다.