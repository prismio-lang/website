# Basic syntax overview

This is a collection of basic syntax elements with examples. At the end of every section, you'll find a link to a detailed description of the related topic.

## Import Statements

Import statements should be at the top of the source file:

```kotlin
import prismio.net.AsycnLoader
import src.ui.Text
import dependency.TextAttributes

// ...
```

> Wildcards (*) are not allowed in import statements.
> 

```kotlin
import src.ui.*
```

## **Program entry point**

An entry point of a Prismio program is the `main` function:

```kotlin
fn main(){
   println("Hello world!")
}
```

Another form of `main` accepts a variable number of `String` arguments:

```kotlin
fun main(args: [String]) {
    println(args)
}
```

## **Print to the standard output**

`print` prints its argument to the standard output:

```kotlin
print("Hello ")
print("world!")
```

`println` prints its arguments and adds a line break, so that the next thing you print appears on the next line:

```kotlin
println("Hello world!")
println(42)
```

## **Read from the standard input**

The `input()` function reads from the standard input. This function reads the entire line the user enters as a string.

You can use the `println()`, `input()`, and `print()` functions together to print messages requesting and showing user input:

```kotlin
// Reads and stores the user input. For example: Happiness
let yourWord = input("Enter any word: ")

// Prints a message with the input
print("You entered the word: ")
print(yourWord)

// You entered the word: Happiness
```

For more information, see [Read standard input](https://prismio-1.vercel.app/docs/read-standard-input).

## **Functions**

A function with two `Int` parameters and `Int` return type with explicit return.
﻿****

```kotlin
fn add(a: Int, b: Int) -> Int {
       return a + b;                 // return is mandatory
     }
```

A function with two `Int` parameters and `Int` return type with implicit return.

```kotlin
fn add(a: Int, b: Int) -> Int = {
       a + b;                 // return is restrcited
     }
```

A function body can be an expression.

```kotlin
fn add(a: Int, b: Int) -> Int = a + b

fn add(a: Int, b: Int) -> Int = (a + b)
```

Function without return type.

```kotlin
fn add(a: Int, b: Int){
   let x = a + b
   println(x)
}
```

See [Functions](https://prismio-1.vercel.app/docs/functions)

## **Variables**

In this language, variables are declared using the `let` keyword, followed by the variable name, an optional type annotation, and an initializer.

Prismio supports type inference and automatically identifies the data type of a declared variable. When declaring a variable, you can omit the type after the variable name.

```kotlin
let x = 5
let name = "Saksham"
let c = 'c'
let isActive = false
```

By default, variables declared with `let` are **immutable**.

**Immutable** mean it’s value cannot be altered in the memory after its value is set initially, such as a constant.

```kotlin
let x = 5
x = 10      // Error: cannot reassign immutable variable

```

To declare a mutable variable, use the `mut` modifier:

```kotlin
let mut x = 5
x = 10      // OK
```

You can use variables only after initializing them. You can either initialize a variable at the moment of declaration or declare a variable first and initialize it later. In the second case, you must specify the data type:

```kotlin
// Initializes the variable x at the moment of declaration; type is not required
let x = 5
// Declares the variable c without initialization; type is required
let c: Int
// Initializes the variable c after declaration 
c = 3
```

You can declare variables at the top level:

```kotlin
let mut radius = 5
let pi = 3.14

fn areaOfCircle(){
   let area = pi * r * r
   print(area)
}

areaOfCircle()    // 78.5

radius = 7

areaOfCircle()    // 153.86
```