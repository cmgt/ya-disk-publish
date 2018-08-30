using System;
using Cmgt.Ya.Disk.Publish;

namespace Test.Console
{
    class Program
    {
        static void Main(string[] args)
        {
            var yadp = new YaDiskPublisher();

            yadp.UploadFile(@"d:\weather.pdf", "Загрузки/weather.pdf");
        }
    }
}
