using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Threading;
using System.Windows.Forms;
using System.Net;
using System.Text.Json;
using System.IO;
using Newtonsoft.Json;
using System.Net.Sockets;

namespace TableOrder_Server
{

    public partial class Form1 : Form
    {
        OrderManagement o_mng = new OrderManagement();
        private MainServer tcpServer;
        public Form1()
        {
            InitializeComponent();
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            tcpServer = new MainServer();
            
            
                // ホスト名を取得する
                string hostname = Dns.GetHostName();

                // ホスト名からIPアドレスを取得する
                IPAddress[] adrList = Dns.GetHostAddresses(hostname);
                foreach (IPAddress address in adrList)
                {
                    this.Text = "Table Order Server 稼働中:" + address.ToString();
                }

            StartAsync(1234);
            OrderManagement o_mng = new OrderManagement();
            ReadMenu();

        }

        public void AddList(string s)
        {
            listBox1.Items.Add(s);
        }

        public void ClearList()
        {
            listBox1.Items.Clear();
        }

        public void Alert(string s)
        {
            MessageBox.Show(s);
        }

        private void Form1_FormClosed(object sender, FormClosedEventArgs e)
        {
            Environment.Exit(0);
        }

        private void listBox1_DoubleClick(object sender, EventArgs e)
        {
            
            
        }
        private void listBox1_Click(object sender, EventArgs e)
        {
            if (listBox1.SelectedIndex < 0)
                return;

            GetOrderInfo(listBox1.SelectedIndex);
        }

        private void toolStripButton1_Click(object sender, EventArgs e)
        {
        }
        private Table[] db = new Table[0];
        DataTable menulist;
        public void ReadMenu()
        {
            string json;
            System.IO.StreamReader sr;

            sr = new System.IO.StreamReader(
            @"sv_addr.txt",
            System.Text.Encoding.GetEncoding("utf-8"));
            //内容をすべて読み込む
            string s = sr.ReadToEnd();
            //閉じる
            sr.Close();
            Console.WriteLine(s + "menu.jsonをダウンロードします");
            WebRequest request = WebRequest.Create(
              s + "menu.json");
            WebResponse response = request.GetResponse();
            using (Stream dataStream = response.GetResponseStream())
            {
                StreamReader reader = new StreamReader(dataStream);
                string responseFromServer = reader.ReadToEnd();
                json = responseFromServer;
            }

            // Close the response.
            response.Close();

            DataSet dataSet = JsonConvert.DeserializeObject<DataSet>(json);

            menulist = dataSet.Tables["menu"];
            //menulist.Rows[0]["num"];

        }
        public bool AddOrder(string s)
        {

            string[] order_data = s.Split(' ')[0].Split(':');
            order_data[1] = System.Web.HttpUtility.UrlDecode(order_data[1]);
            Form1 f = new Form1();
            //Console.WriteLine("端末名:" + order_data[0] + "から、\n" + order_data[1] + "\nの注文を受けました。");
            int table_dbnum = -1;
            for (int i = 0; i < db.Length; ++i)
            {
                if (db[i].num == order_data[0])
                {
                    table_dbnum = i;
                    break;
                }
            }
            //DBにテーブル情報が保管されていなかったとき
            if (table_dbnum == -1)
            {

                Array.Resize(ref db, db.Length + 1);
                table_dbnum = db.Length - 1;
                db[table_dbnum].num = order_data[0];
                db[table_dbnum].enter = DateTime.Now.ToString();
            }


            string[] order_arr = order_data[1].Split('-');
            for (int i = 0; i < order_arr.Length; ++i)
            {
                string[] order_arr_2 = order_arr[i].Split(',');
                
                    for (int iii = 0; iii < int.Parse(order_arr_2[1]); ++iii)
                    {
                        //Console.WriteLine(iii.ToString() + "回目の追加");
                        db[table_dbnum].orderCount += 1;
                        Array.Resize(ref db[table_dbnum].order, db[table_dbnum].orderCount);
                        Array.Resize(ref db[table_dbnum].order_stat, db[table_dbnum].orderCount);
                    db[table_dbnum].order[db[table_dbnum].orderCount - 1] = int.Parse(order_arr_2[0]);
                    db[table_dbnum].order_stat[db[table_dbnum].orderCount - 1] = 0;
                }


            }

            
            GetOrderInfo(table_dbnum);
            Refresh();
            listBox1.SetSelected(table_dbnum, true);
            return true;
        }


        void Refresh()
        {

            ClearList();
            for (int i = 0; i < db.Length; ++i)
            {
                Console.WriteLine(db[i].num);
                AddList(db[i].num);
            }
        }


        public void GetOrderInfo(int table_dbnum)
        {
            listBox2.Items.Clear();
            //Console.WriteLine(db[table_dbnum].num);
            for (int i = 0; i < db[table_dbnum].orderCount; ++i)
            {
                for(int ii = 0; ii< menulist.Rows.Count; ++ii)
                {
                    if(int.Parse(menulist.Rows[ii]["num"].ToString()) == db[table_dbnum].order[i] && db[table_dbnum].order_stat[i] == 0)
                    {
                        //Console.WriteLine(i.ToString() + menulist.Rows[ii]["name"]);
                        listBox2.Items.Add((i+1).ToString() + ":" + menulist.Rows[ii]["name"].ToString().Replace("<br>",""));
                        break;

                    }
                }
                
            }
        }

        string GetRecent(string s)
        {
            s = s.Split(' ')[0];
            for (int i = 0; i < db.Length; ++i)
            {
                
                if (db[i].num == s)
                {
                    

                    string _s = "";
                    int ii = 0;
                    foreach (int _i in db[i].order)
                    {
                        _s = _s + "," + _i.ToString() + "_" + db[i].order_stat[ii].ToString();

                        ii++;
                    }
                    return _s.Remove(0, 1);
                }
                
                    
                    
                
            }
            //注文履歴がなかった場合
            return "none";
        }

        public async Task StartAsync(int port)
        {
            var tcpListener = new TcpListener(IPAddress.Any, port);
            tcpListener.Start();

            while (true)
            {
                using (var tcpClient = await tcpListener.AcceptTcpClientAsync())
                using (var stream = tcpClient.GetStream())
                using (var reader = new StreamReader(stream))
                using (var writer = new StreamWriter(stream))
                {
                    // 接続元を出力しておく
                    Console.WriteLine(tcpClient.Client.RemoteEndPoint);

                    // ヘッダー部分を全部読んで捨てる
                    string resMsg = await reader.ReadLineAsync();
                    char c1 = resMsg[5];
                    if (c1 == 'O')
                    {
                        string sendData = System.Web.HttpUtility.UrlDecode(resMsg);
                        if (AddOrder(resMsg.Split('\n')[0].Remove(0, 6)))
                        {
                            await writer.WriteLineAsync("HTTP/1.0 200 OK");
                            await writer.WriteLineAsync("Content-Type: text/plain; charset=UTF-8\nAccess-Control-Allow-Origin:*");
                            await writer.WriteLineAsync();
                            await writer.WriteLineAsync("ORDER_OK");


                        }


                    }
                    else if(c1 == 'R')
                    {
                        string sendData = System.Web.HttpUtility.UrlDecode(resMsg);
                        string response = GetRecent(resMsg.Split('\n')[0].Remove(0, 6));
                        await writer.WriteLineAsync("HTTP/1.0 200 OK");
                        await writer.WriteLineAsync("Content-Type: text/plain; charset=UTF-8\nAccess-Control-Allow-Origin:*");
                        await writer.WriteLineAsync();
                        Console.WriteLine(response);
                        if (response != null)
                            await writer.WriteLineAsync(response);
                        else
                            await writer.WriteLineAsync("err");

                    }
                    else
                    {
                        await writer.WriteLineAsync("HTTP/1.0 200 OK");
                        await writer.WriteLineAsync("Content-Type: text/plain; charset=UTF-8\nAccess-Control-Allow-Origin:*");
                        await writer.WriteLineAsync();
                        await writer.WriteLineAsync("ORDER_NG");


                    }


                }
            }
        }

        private void toolStripButton4_Click(object sender, EventArgs e)
        {
            System.Diagnostics.Process.Start("http://127.0.0.1:5500/index.html?table=" + db[listBox1.SelectedIndex].num);
        }

        private void toolStripButton2_Click(object sender, EventArgs e)
        {
            
            if (listBox2.Text == "")
            {
                MessageBox.Show("注文を選択してください");
                return;
            }
            

            db[listBox1.SelectedIndex].order_stat[int.Parse(listBox2.Text.Split(':')[0])-1] = 1;
            GetOrderInfo(listBox1.SelectedIndex);
        }

        private void toolStripButton3_Click(object sender, EventArgs e)
        {
            if (listBox2.Text == "")
            {
                MessageBox.Show("注文を選択してください");
                return;
            }
            DialogResult dr = MessageBox.Show("本当によろしいですか？", "確認", MessageBoxButtons.YesNo);

            if (dr == System.Windows.Forms.DialogResult.Yes)
            {
                db[listBox1.SelectedIndex].order_stat[int.Parse(listBox2.Text.Split(':')[0]) - 1] = -1;
                GetOrderInfo(listBox1.SelectedIndex);
            }


        }

    }

    struct Table
    {
        public string num;      //テーブル番号
        public string enter;    //入店時間  
        public int[] order;    //注文履歴(注文番号,提供済みか(0,1))
        public int[] order_stat;    //注文履歴(注文番号,提供済みか(0,1))
        public int orderCount;    //注文履歴(注文番号,提供済みか(0,1))

        void Sample(int[] order, int[] order_stat, int orderCount)
        {
            order = new int[1];
            order_stat = new int[1];
            orderCount = 0;
        }
    }


    public class MenuData
    {
        public MenuItem[] Menu { get; set; }
    }

    public class MenuItem
    {
        public int genre { get; set; }
        public int num { get; set; }
        public string name { get; set; }
        public string img { get; set; }
        public int price { get; set; }
    }
}
