# dirty-check

Tiny reactivity system with dirty checking.

### Motivation

[点我](https://zhuanlan.zhihu.com/p/278238753)

由于基于`对象劫持`的响应式方案存在 ref 的缺陷，不利于组合……我们企图找到一种替代方案

这个仓库提供了一种脏检查的思路，它没有 ref 的缺陷，没有 hooks 的限制，对组合更有利

### Usage

```js
import { ref, computed, invalidate } from './index.js'
const count = ref(0)
const double = computed(() => count() * 2)
count(1)
count(2)

invalidate() // 开始脏检查
console.log(double()) // 4
```

### Implement

脏检查也是一种依赖收集，每调用一次 invalidate 则开启一轮的脏检查，此时 computed 会重新计算

和 angularjs 不同，这个仓库使用了`有向图`的数据结构，约定脏检查是单向的，性能显著提升

- vs setState

脏检查和 setState 是类似的，只是 setState 必须利用闭包缓存组件实例，而脏检查的响应式不需要和组件强绑定

```js
const double = computed(() => count() * 2)

const stateLessComponent = () => <button onClick={() => invalidate()}>{count()}</button>
```

- vs Proxy

脏检查和对象劫持也是类似的，一般来讲，脏检查性能会稍差，API 也低级些，但是没有 ref 的限制

### Compiler

建议和编译手段结合使用，脏检查的思路非常适合走编译路线

```html
<script>
  let count = 0
  let double = count * 2

  function handleClick() {
    count++
  }
</script>

<button @click={handleClick}>{double}</button>
```

大约编译成这个样子：

```html
<script>
  let count = ref(0)
  let double = computed(() => count() * 2)

  function handleClick() {
    count(count() + 1)
  }
</script>

<button onclick=handleClick()>double()</button>
```

不需要改变语义，不需要任何语法糖，runtime 也非常轻量

p.s.

俺不开倒车，不同的机制有不同的优势，在 vue composition API 和 hooks API 都出现了限制的前提下

脏检查恰好可以规避这些限制，可以说最适合组合的方案了

### License

MIT @132
