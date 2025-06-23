using System;
using System.Collections.Generic;
using System.Linq;
namespace List.classes
{

    public class Boks
    {
        public string LastName { get; set; }
        public string FirstName { get; set; }
        public int Age { get; set; }
        public int Weight { get; set; }

        public List<Boks> boks { get; set; }  

        public Boks()
        {
            LastName = "No Name";
            FirstName = "No Name";
            Age = 0;
            Weight = 0;

        }

        public void TableOfMen()
        {
            boks = new List<Boks>
        {
          new Boks{LastName="do'stmatov", FirstName="Hasanboy", Age=33, Weight=70},
          new Boks{LastName="Merqo'ziyev", FirstName="Bektemir", Age=37, Weight=78},
          new Boks{LastName="G'iyosev", FirstName="shaxram", Age=35, Weight=78},
          new Boks{LastName="Ahmadaliyev", FirstName="Murodjon", Age=28, Weight=70},
          new Boks{LastName="Nuriddinov", FirstName="Jalolbek", Age=32, Weight=45}
        };
        }

        public void LowWeightOfMen()
        {
            var list = boks.Where(o => o.Weight < 50);
            System.Console.WriteLine("50kg dan past vazn toifadagilar");
            foreach (var portion in list)
            {

                System.Console.WriteLine($"{portion.FirstName} {portion.LastName}, Yosh: {portion.Age} Vazn: {portion.Weight}");
            }
            System.Console.WriteLine();
        }

        public void MediumWeightOfMen()
        {
            var Mlist = boks.Where(q => q.Weight > 50 && q.Weight < 76);
            System.Console.WriteLine("50-76 kg oralig'idagi vazn toifadagilar");
            foreach (var Mportion in Mlist)
            {

                System.Console.WriteLine($"{Mportion.FirstName} {Mportion.LastName} Yosh: {Mportion.Age}, Vazn: {Mportion.Weight}");

            }

            System.Console.WriteLine();
        }

        public void HighWeightOfMen()
        {

            var Hlist = boks.Where(n => n.Weight > 76);

            System.Console.WriteLine("yuqori vazn toifadagilar");
            foreach (var Hportion in Hlist)
            {
                System.Console.WriteLine($"{Hportion.FirstName} {Hportion.LastName}, Yosh: {Hportion.Age} Vazn: {Hportion.Weight}");
            }
        }
    }
}
