using System;
using System.Linq;
using System.Collections.Generic;
class Program
{
    static void Main()
    {
        //1-MASALA
    //     Console.Write("Satrni kiriting: ");
    //     string input = Console.ReadLine();
        
    //     if (IsPalindrome(input))
    //         Console.WriteLine("Palindrom");
    //     else
    //         Console.WriteLine("Palindrom emas");
    // }

    // static bool IsPalindrome(string str)
    // {
    //     str = str.ToLower().Replace(" ", ""); 
    //     int left = 0, right = str.Length - 1;
        
    //     while (left < right)
    //     {
    //         if (str[left] != str[right])
    //             return false;
    //         left++;
    //         right--;
    //     }
        
    //     return true;

    // // 2-masala
    // System.Console.Write("temperaturani gradusda kiriting:  ");
    // double t=double.Parse(Console.ReadLine());
    // double f=(t*9/5)+32;
    // double T=t+273.15;
    // System.Console.WriteLine($"selsyus: {t}");
    // System.Console.WriteLine($"Fahrenheit: {f}");
    // System.Console.WriteLine($"kelvin: {T}");


// 3-masala





    
    
        // List<int> numbers = new List<int> { 5, 2, 8, 1, 4 };
        // List<int> numbers1=new List<int> {5,2,8,1,4};

        // numbers = numbers.OrderByDescending(x => x).ToList(); // Kamayish tartibida saralash
        // numbers1.Sort(); //o'sish tartibda

        // Console.WriteLine("Saralangan ro'yxat: " + string.Join(", ", number));  

        // Console.WriteLine("Kamayish tartibida: " + string.Join(", ", numbers));
        



// 4-masala
    
    
        Console.Write("Matn kiriting: ");
        string input = Console.ReadLine();  // Foydalanuvchidan matn olish

        Dictionary<char, int> charCount = new Dictionary<char, int>(); // Harflarni sanash uchun lug‘at

        foreach (char c in input) // Har bir belgi bo‘yicha aylanish
        {
            if (charCount.ContainsKey(c)) // Agar belgi avval mavjud bo'lsa
                charCount[c]++; // Qiymatini oshiramiz
            else
                charCount[c] = 1; // Yangi belgi bo'lsa, 1 ga tenglashtiramiz
        }

        foreach (var item in charCount) // Lug‘atni ekranga chiqarish
        {
            Console.WriteLine($"'{item.Key}': {item.Value} martta");
        }
    }
}

    



    

