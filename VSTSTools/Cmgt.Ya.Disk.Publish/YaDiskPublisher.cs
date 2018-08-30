using System;
using YandexDiskNET;

namespace Cmgt.Ya.Disk.Publish
{
    public class YaDiskPublisher
    {
        private YandexDiskRest yaDiskClient;

        public YaDiskPublisher()
        {
            yaDiskClient = new YandexDiskRest("AQAAAAACS5E7AAUtDULTdL3sD0VJqHggFzFIyfw");
        }

        public void UploadFile(string source, string destination)
        {
            var err = yaDiskClient.UploadResource(destination, source, true);            
        }
    }
}
