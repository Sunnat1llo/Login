using System;
using System.Collections.Generic;
using System.Linq;
using List.classes;

  



// 1-masala

// class Oquvchi            
// {
//     public string Familiya { get; set; }
//     public string Ism { get; set; }
//     public int Baho { get; set; }
// }

// class Program
// {
//     static void Main()  
//     {

//         List<Oquvchi> oquvchilar = new List<Oquvchi>
//         {
//             new Oquvchi { Familiya = "Aliyev", Ism = "Ali", Baho = 5 },
//             new Oquvchi { Familiya = "Karimova", Ism = "Nodira", Baho = 4 },
//             new Oquvchi { Familiya = "Rustamov", Ism = "Bekzod", Baho = 3 },
//             new Oquvchi { Familiya = "Xoliqov", Ism = "Sardor", Baho = 5 },
//             new Oquvchi { Familiya = "Tursunova", Ism = "Zulfiya", Baho = 4 }
//         };


//         Console.Write("Qaysi bahodagi o'quvchilarni ko'rmoqchisiz (1-5): ");
// int kiritilganBaho = int.Parse(Console.ReadLine());


//         var natija = oquvchilar.Where(o => o.Baho == kiritilganBaho);

//         Console.WriteLine($"\n{ kiritilganBaho } bahoga ega o'quvchilar:");
//         foreach (var oquvchi in natija)      
//         {
//             Console.WriteLine($"{oquvchi.Familiya} {oquvchi.Ism} - Baho: {oquvchi.Baho}");
//         }


//         if (!natija.Any())
//         {
//             Console.WriteLine("Bu bahoga ega o‘quvchilar topilmadi.");
//         }
//     }
// }


// 2-masala

// class Car
// {
//     public string CarName { get; set; }
//     public string CarMarka { get; set; }
//     public int CarPrice { get; set; }


// }

// class Program
// {
//     static void Main()
//     {
//         List<Car> car = new List<Car>
//         {
//           new  Car{CarName="cobalt", CarMarka="Chevrolet", CarPrice=150},
//           new Car{CarName="Sedan", CarMarka="Toyota Camry", CarPrice=340},
//           new Car{CarName="Pickup", CarMarka="toyota", CarPrice=100},
//           new Car{CarName="suv", CarMarka="Hyundai", CarPrice=300}
//         };
//         System.Console.Write("qancha narx oralig'idagi mashina qidiryapsiz?   ");
//         int MinPrice = int.Parse(Console.ReadLine());
//         int MaxPrice = int.Parse(Console.ReadLine());
//         var among = car.Where(o => o.CarPrice > MinPrice && o.CarPrice < MaxPrice);

//         foreach (var print in among)
//         {
//             System.Console.WriteLine($"{print.CarName}, {print.CarMarka}, {print.CarPrice}");
//         }

//         if (!among.Any())
//         {
//             System.Console.WriteLine("Bunday narxda ,ashina yo'q");
//         }
//     }
// }

// 3-masala 



class Program
{
   
    static void Main()   
    {
      Boks boks = new Boks();
    boks.TableOfMen();
    boks.LowWeightOfMen();





        var Mlist = boks.boks.Where(q => q.Weight > 50 && q.Weight < 76);
        System.Console.WriteLine("50-76 kg oralig'idagi vazn toifadagilar");
        foreach (var Mportion in Mlist)
        {

            System.Console.WriteLine($"{Mportion.FirstName} {Mportion.LastName} Yosh: {Mportion.Age}, Vazn: {Mportion.Weight}");

        }

        System.Console.WriteLine();

        var Hlist = boks.boks.Where(n => n.Weight > 76);

        System.Console.WriteLine("yuqori vazn toifadagilar");
        foreach (var Hportion in Hlist)
        {
            System.Console.WriteLine($"{Hportion.FirstName} {Hportion.LastName}, Yosh: {Hportion.Age} Vazn: {Hportion.Weight}");
        }
    }
}
