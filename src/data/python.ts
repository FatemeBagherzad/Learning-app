import type { Sheet } from '../types'

const python: Sheet = {
  id: 'python',
  label: 'Python',
  lang: 'python',
  accent: '#3b82f6',
  sections: [
    {
      title: 'Basics & variables',
      blurb: 'No declarations, no semicolons. Indentation (4 spaces) is the block syntax.',
      snippets: [
        {
          note: 'Assignment and dynamic types',
          code: `name = "Ada"          # str
age = 36               # int
height = 1.72          # float
active = True          # bool
nothing = None         # NoneType

x, y = 1, 2            # tuple unpack
x, y = y, x            # swap
a = b = 0              # chain
count = 1_000_000      # readable digits`,
        },
        {
          note: 'Inspect and convert',
          code: `type(age)              # <class 'int'>
isinstance(age, int)   # True
int("42"), float("3.5"), str(42)
bool(""), bool([]), bool(0)   # all False`,
        },
        {
          note: 'Print and f-strings',
          code: `print("hi", name, sep=" | ", end="\\n")
print(f"{name} is {age} years old")
print(f"{height:.1f} m")        # 1.7
print(f"{age=}")                # age=36`,
        },
      ],
    },
    {
      title: 'Strings',
      snippets: [
        {
          note: 'Common operations',
          code: `s = "  Hello, World  "
s.strip()              # "Hello, World"
s.lower(), s.upper(), s.title()
s.replace("World", "Py")
s.strip().split(", ")  # ['Hello', 'World']
", ".join(["a", "b"])  # "a, b"
len(s)
"World" in s           # True
s.strip().startswith("He")`,
        },
        {
          note: 'Slicing (start:stop:step — stop is exclusive)',
          code: `w = "python"
w[0]       # 'p'
w[-1]      # 'n'
w[1:4]     # 'yth'
w[:3]      # 'pyt'
w[::2]     # 'pto'
w[::-1]    # 'nohtyp'  (reverse)`,
        },
        {
          note: 'Formatting & multiline',
          code: `f"{3.14159:.2f}"       # '3.14'
f"{42:>6}"             # '    42'  right align
f"{0.256:.1%}"         # '25.6%'
f"{1234567:,}"         # '1,234,567'

text = """line one
line two"""`,
        },
      ],
    },
    {
      title: 'Numbers & math',
      snippets: [
        {
          code: `7 / 2        # 3.5   true division
7 // 2       # 3     floor division
7 % 2        # 1     remainder
2 ** 10      # 1024  power
abs(-5), round(3.567, 2), divmod(7, 2)
min(3, 9), max([3, 9]), sum([1, 2, 3])`,
        },
        {
          note: 'math & random modules',
          code: `import math, random

math.sqrt(16), math.pi, math.floor(2.7), math.ceil(2.1)
random.random()            # 0.0 - 1.0
random.randint(1, 6)       # inclusive both ends
random.choice(["a", "b"])
random.shuffle(my_list)    # in place`,
        },
      ],
    },
    {
      title: 'Lists',
      blurb: 'Ordered, mutable. Your default container.',
      snippets: [
        {
          code: `nums = [3, 1, 2]
nums.append(4)         # [3, 1, 2, 4]
nums.insert(0, 9)      # at index
nums.extend([5, 6])
nums.remove(9)         # by value (first match)
nums.pop()             # last item, removed
nums.pop(0)            # by index
nums[1:3] = [7]        # slice assign
del nums[0]
nums.clear()`,
        },
        {
          note: 'Read & order',
          code: `len(nums), 3 in nums, nums.index(3), nums.count(3)
sorted(nums)                  # new list
sorted(nums, reverse=True)
sorted(words, key=len)
sorted(people, key=lambda p: p["age"])
nums.sort()                   # in place, returns None
nums.reverse()
copy = nums[:]                # or list(nums)`,
        },
        {
          note: 'Loop with index / in pairs',
          code: `for i, item in enumerate(nums, start=1):
    print(i, item)

for a, b in zip(names, ages):
    print(a, b)`,
        },
      ],
    },
    {
      title: 'Dictionaries',
      snippets: [
        {
          code: `user = {"name": "Ada", "age": 36}
user["email"] = "a@b.c"        # add / update
user.get("phone")              # None, no error
user.get("phone", "n/a")       # default
user.pop("age", None)
"name" in user                 # True
del user["email"]
user.update({"age": 37})
len(user)`,
        },
        {
          note: 'Iterate',
          code: `for key in user: ...
for key, value in user.items(): ...
list(user.keys()), list(user.values())`,
        },
        {
          note: 'Merge, nest, invert',
          code: `merged = {**a, **b}            # b wins
merged = a | b                 # 3.9+
a |= b                         # update in place

cfg = {"db": {"host": "localhost"}}
cfg["db"]["host"]
flipped = {v: k for k, v in user.items()}`,
        },
      ],
    },
    {
      title: 'Tuples & sets',
      snippets: [
        {
          note: 'Tuple: ordered, immutable — great for fixed records',
          code: `point = (3, 4)
x, y = point
single = (1,)          # trailing comma matters
point[0]               # 3  (no assignment allowed)`,
        },
        {
          note: 'Set: unique, unordered, fast membership',
          code: `s = {1, 2, 2, 3}       # {1, 2, 3}
empty = set()          # NOT {}
s.add(4); s.discard(1) # discard won't raise
2 in s                 # fast

{1, 2} | {2, 3}        # union        {1, 2, 3}
{1, 2} & {2, 3}        # intersection {2}
{1, 2} - {2, 3}        # difference   {1}
unique = list(set(items))`,
        },
      ],
    },
    {
      title: 'Control flow',
      snippets: [
        {
          code: `if score > 90:
    grade = "A"
elif score > 80:
    grade = "B"
else:
    grade = "C"

grade = "A" if score > 90 else "B"     # ternary`,
        },
        {
          note: 'Loops',
          code: `for i in range(5):        # 0..4
for i in range(2, 10, 2): # 2,4,6,8
for ch in "abc": ...

while queue:
    item = queue.pop()
    if bad(item):
        continue          # next iteration
    if done(item):
        break             # leave loop
else:
    print("loop finished without break")`,
        },
        {
          note: 'match (3.10+)',
          code: `match command.split():
    case ["go", direction]:
        move(direction)
    case ["quit" | "exit"]:
        stop()
    case _:
        print("unknown")`,
        },
        {
          note: 'Truthiness & comparison chaining',
          code: `if items:            # non-empty
if not items:        # empty / None
if 0 < age < 120: ...
if value is None: ...        # identity, not ==`,
        },
      ],
    },
    {
      title: 'Comprehensions',
      blurb: 'The Pythonic way to build a list, dict or set from another iterable.',
      snippets: [
        {
          code: `squares = [n * n for n in range(10)]
evens = [n for n in nums if n % 2 == 0]
labels = [f"#{n}" for n in nums]
flat = [x for row in matrix for x in row]
pairs = [(a, b) for a in "ab" for b in (1, 2)]

by_id = {u["id"]: u for u in users}
names = {u["name"] for u in users}       # set
gen = (n * n for n in range(1_000_000))  # lazy generator`,
        },
        {
          note: 'Condition on the value',
          code: `tagged = ["even" if n % 2 == 0 else "odd" for n in nums]`,
        },
      ],
    },
    {
      title: 'Functions',
      snippets: [
        {
          code: `def greet(name, greeting="Hello"):
    """Docstring: shows in help(greet)."""
    return f"{greeting}, {name}!"

greet("Ada")
greet("Ada", greeting="Hi")      # keyword argument`,
        },
        {
          note: 'Any number of arguments',
          code: `def log(*args, **kwargs):
    print(args)      # tuple
    print(kwargs)    # dict

log(1, 2, level="warn")
log(*my_list, **my_dict)         # unpack when calling`,
        },
        {
          note: 'Type hints, lambda, multiple returns',
          code: `def add(a: int, b: int = 0) -> int:
    return a + b

double = lambda n: n * 2         # keep for tiny cases

def stats(nums):
    return min(nums), max(nums)  # tuple
lo, hi = stats([3, 1, 4])`,
        },
        {
          note: 'Mutable default trap',
          code: `def bad(items=[]):      # shared between calls!
    items.append(1)

def good(items=None):
    items = [] if items is None else items`,
        },
      ],
    },
    {
      title: 'Classes',
      snippets: [
        {
          code: `class Dog:
    species = "canine"             # class attribute

    def __init__(self, name, age):
        self.name = name           # instance attribute
        self._secret = "private-ish"

    def speak(self):
        return f"{self.name} says woof"

    def __repr__(self):
        return f"Dog({self.name!r}, {self.age!r})"

d = Dog("Rex", 3)
d.speak()
isinstance(d, Dog)`,
        },
        {
          note: 'Inheritance & properties',
          code: `class Puppy(Dog):
    def __init__(self, name):
        super().__init__(name, 0)

    def speak(self):               # override
        return super().speak() + " (squeaky)"

class Circle:
    def __init__(self, r): self.r = r

    @property
    def area(self):                # use as c.area, no ()
        return 3.14159 * self.r ** 2

    @staticmethod
    def unit(): return Circle(1)`,
        },
        {
          note: 'dataclass — less boilerplate',
          code: `from dataclasses import dataclass, field

@dataclass
class Point:
    x: float
    y: float = 0.0
    tags: list[str] = field(default_factory=list)

p = Point(1, 2)        # __init__, __repr__, __eq__ free`,
        },
      ],
    },
    {
      title: 'Errors & exceptions',
      snippets: [
        {
          code: `try:
    value = int(text)
except ValueError as e:
    print("bad number:", e)
except (KeyError, TypeError):
    pass
else:
    print("no error happened")
finally:
    cleanup()               # always runs`,
        },
        {
          note: 'Raise & define',
          code: `if age < 0:
    raise ValueError("age must be >= 0")

class ConfigError(Exception):
    pass

raise ConfigError("missing key") from e   # keep cause`,
        },
        {
          note: 'Assert & guard',
          code: `assert total > 0, "total must be positive"   # dev checks only`,
        },
      ],
    },
    {
      title: 'Files & paths',
      snippets: [
        {
          note: 'with closes the file for you',
          code: `with open("data.txt", encoding="utf-8") as f:
    text = f.read()            # whole file
    # f.readlines()            # list of lines

with open("out.txt", "w", encoding="utf-8") as f:
    f.write("hello\\n")
    f.writelines(lines)

with open("log.txt", "a") as f:    # append
    f.write("entry\\n")

for line in open("big.txt"):       # memory friendly
    process(line.rstrip())`,
        },
        {
          note: 'pathlib — modern paths',
          code: `from pathlib import Path

p = Path("data") / "notes.txt"
p.exists(), p.is_file(), p.suffix, p.stem, p.name
p.read_text(encoding="utf-8")
p.write_text("hi")
Path("out").mkdir(parents=True, exist_ok=True)
list(Path(".").glob("**/*.py"))`,
        },
        {
          note: 'JSON & CSV',
          code: `import json, csv

data = json.loads('{"a": 1}')
text = json.dumps(data, indent=2)
json.dump(data, open("f.json", "w"), indent=2)
data = json.load(open("f.json"))

with open("t.csv", newline="") as f:
    for row in csv.DictReader(f):
        print(row["name"])`,
        },
      ],
    },
    {
      title: 'Handy standard library',
      snippets: [
        {
          note: 'collections & itertools',
          code: `from collections import Counter, defaultdict, deque

Counter("mississippi").most_common(2)   # [('i', 4), ('s', 4)]

groups = defaultdict(list)
groups[key].append(value)               # no KeyError

q = deque([1, 2]); q.appendleft(0); q.popleft()

from itertools import chain, combinations, product, groupby
list(chain([1, 2], [3]))                # [1, 2, 3]
list(combinations("abc", 2))             # pairs`,
        },
        {
          note: 'datetime',
          code: `from datetime import datetime, date, timedelta

now = datetime.now()
today = date.today()
now.strftime("%Y-%m-%d %H:%M")
datetime.strptime("2026-01-31", "%Y-%m-%d")
tomorrow = today + timedelta(days=1)
(d2 - d1).days`,
        },
        {
          note: 'regex',
          code: `import re

re.search(r"\\d+", "abc 42")        # match object or None
m = re.search(r"(\\d+)-(\\d+)", s)
m.group(0), m.group(1)
re.findall(r"\\w+", text)            # list of all matches
re.sub(r"\\s+", " ", text)           # collapse whitespace
re.split(r"[,;]", text)`,
        },
        {
          note: 'Everyday builtins',
          code: `any([False, True]), all([True, True])
list(map(str.upper, words))
list(filter(None, items))        # drop falsy
list(reversed(nums))
sorted(d.items(), key=lambda kv: kv[1])
list(zip(*matrix))               # transpose`,
        },
      ],
    },
    {
      title: 'Generators & iterators',
      snippets: [
        {
          code: `def countdown(n):
    while n > 0:
        yield n            # pauses here, resumes on next()
        n -= 1

for n in countdown(3): print(n)   # 3 2 1
list(countdown(3))

it = iter([1, 2])
next(it)              # 1
next(it, "done")      # default instead of StopIteration`,
        },
        {
          note: 'Custom context manager',
          code: `from contextlib import contextmanager

@contextmanager
def timer():
    import time; t = time.time()
    try:
        yield
    finally:
        print(f"{time.time() - t:.2f}s")

with timer():
    heavy_work()`,
        },
      ],
    },
    {
      title: 'Async',
      snippets: [
        {
          code: `import asyncio

async def fetch(n):
    await asyncio.sleep(1)
    return n * 2

async def main():
    one = await fetch(1)                       # sequential
    many = await asyncio.gather(*[fetch(i) for i in range(5)])  # parallel
    print(one, many)

asyncio.run(main())`,
        },
      ],
    },
    {
      title: 'Type hints',
      snippets: [
        {
          code: `def totals(rows: list[dict[str, int]]) -> tuple[int, int]: ...

name: str = "Ada"
scores: dict[str, float] = {}
maybe: str | None = None          # 3.10+  (Optional[str])
nums: list[int] = []

from typing import Any, Callable, Iterable, TypedDict

handler: Callable[[int, str], bool]

class User(TypedDict):
    id: int
    name: str`,
        },
      ],
    },
    {
      title: 'Modules, packages & env',
      snippets: [
        {
          code: `import math
import numpy as np
from pathlib import Path
from .utils import helper          # relative, inside a package

if __name__ == "__main__":         # only when run directly
    main()`,
        },
        {
          note: 'Virtual env & packages (terminal)',
          lang: 'shell',
          code: `python -m venv .venv
.venv\\Scripts\\activate        # Windows
source .venv/bin/activate      # macOS / Linux
pip install requests
pip freeze > requirements.txt
pip install -r requirements.txt
python script.py`,
        },
      ],
    },
  ],
}

export default python
