# คู่มือการนำ Backend ขึ้น Render.com แบบละเอียด (Step-by-Step)

คู่มือนี้จะพาคุณนำ Backend (`server.js`) ของ **Winamp YouTube Music** ขึ้นโฮสต์ฟรีบน **[Render.com](https://render.com)** เพื่อให้แอพบนโทรศัพท์มือถือสามารถค้นหาเพลงและสตรีมเพลง YouTube Music ได้ตลอด 24 ชั่วโมง โดยไม่ต้องเปิดคอมพิวเตอร์ทิ้งไว้

---

## 📌 ข้อมูลสำคัญของระบบเรา (Cloud-Ready)
ไฟล์ `server/server.js` ของเราถูกออกแบบมาให้รองรับ Cloud 100% อยู่แล้ว:
- ใช้ `process.env.PORT` อัตโนมัติ (Render กำหนดพอร์ตให้อัตโนมัติ)
- Bind IP ด้วย `'0.0.0.0'` รองรับทราฟฟิกจากภายนอก
- มีระบบ CORS อนุญาตให้แอพมือถือเข้าถึงได้ทุกที่

---

## ขั้นตอนที่ 1: เตรียมโค้ดขึ้น GitHub

Render.com จะดึงโค้ดจาก **GitHub** มา Deploy อัตโนมัติ

1. **สร้าง Git Repository (หากยังไม่ได้สร้าง):**
   เปิด Terminal หรือ PowerShell ที่โฟลเดอร์โปรเจกต์ `d:\winamp\winamp-ytm-app`:
   ```bash
   git init
   git add .
   git commit -m "feat: Winamp YTM ready for Render deployment"
   ```
2. **สร้าง Repository ใหม่บน GitHub:**
   - เข้าเว็บ [github.com](https://github.com) -> คลิกปุ่ม **New** เพื่อสร้าง Repository (ตั้งชื่อเช่น `winamp-ytm-app` และเลือกเป็น **Public** หรือ **Private** ก็ได้)
   - นำคำสั่งจาก GitHub มา Push โค้ดขึ้นไป:
     ```bash
     git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
     git branch -M main
     git push -u origin main
     ```

---

## ขั้นตอนที่ 2: สร้าง Web Service บน Render.com

จากหน้า Dashboard ของคุณตามรูปที่แสดงอยู่ (**Create a new Service**):

```
+-------------------------------------------------------------+
|  [ Web Services ]                                           |
|  Dynamic web app. Ideal for full-stack apps, API servers    |
|  👉 คลิกปุ่ม: "New Web Service ->"                           |
+-------------------------------------------------------------+
```

1. คลิกที่การ์ด **Web Services** (`New Web Service ->`)
2. เลือก **"Build and deploy from a Git repository"** แล้วคลิก **Next**
3. เลือกบัญชี GitHub ของคุณและเลือก Repository ที่เพิ่ง Push ขึ้นไป (เช่น `winamp-ytm-app`) แล้วกด **Connect**

---

## ขั้นตอนที่ 3: ตั้งค่า Configuration บน Render

ในหน้ากรอกข้อมูล ให้ตั้งค่าตามตารางนี้อย่างถูกต้อง:

| ช่องการตั้งค่า (Field) | ค่าที่ต้องระบุ | คำอธิบาย |
| :--- | :--- | :--- |
| **Name** | `winamp-ytm-backend` | ชื่อ Service ของคุณ (ตั้งชื่ออะไรก็ได้) |
| **Region** | **Singapore (Southeast Asia)** | 🇸🇬 แนะนำเลือกสิงคโปร์ เพื่อความเร็วและ Ping ต่ำที่สุดสำหรับผู้ใช้ในไทย |
| **Branch** | `main` (หรือ `master`) | สาขาของโค้ดใน Git |
| **Root Directory** | `server` | ⚠️ **สำคัญมาก:** ระบุ `server` เพื่อให้ Render รู้ว่าโค้ด Backend อยู่ในโฟลเดอร์นี้ |
| **Runtime** | `Node` | เลือกสภาพแวดล้อม Node.js |
| **Build Command** | `npm install` | คำสั่งติดตั้งแพ็กเกจ (distube/ytdl-core, express, yt-search) |
| **Start Command** | `node server.js` | คำสั่งเริ่มรันเซิร์ฟเวอร์ |
| **Instance Type** | **Free** | เลือก Free Tier ($0/month) |

---

## ขั้นตอนที่ 4: สั่ง Deploy และรอระบบเริ่มทำงาน

1. เลื่อนลงมาด้านล่างสุด แล้วคลิกปุ่ม **"Deploy Web Service"**
2. Render จะเริ่มรัน Logs:
   - ดาวน์โหลด Node.js
   - รัน `npm install`
   - รัน `node server.js`
3. เมื่อเห็นข้อความ:
   ```
   📻 Winamp YouTube Music Server is running!
   ==> Your service is live 🎉
   ```
4. ด้านบนซ้ายใต้ชื่อ Service คุณจะได้รับ **URL ประจำตัว (HTTPS)** ฟรีทันที เช่น:
   👉 `https://winamp-ytm-backend.onrender.com`

---

## ขั้นตอนที่ 5: ทดสอบความพร้อมของเซิร์ฟเวอร์

ทดสอบเปิดลิงก์บนเบราว์เซอร์:
1. **ทดสอบ Health Check:**
   `https://winamp-ytm-backend.onrender.com/api/health`
   - ผลลัพธ์ต้องแสดง JSON: `{"status":"ok","service":"winamp-ytm-server",...}`
2. **ทดสอบค้นหาเพลง:**
   `https://winamp-ytm-backend.onrender.com/api/search?q=bodyslam`
   - ผลลัพธ์ต้องแสดงรายการเพลงที่ค้นหาได้จาก YouTube

---

## ขั้นตอนที่ 6: นำ URL ไปใส่ในแอพ Winamp บนโทรศัพท์มือถือ

1. เปิดแอพ **Winamp** บนโทรศัพท์มือถือของคุณ
2. ที่แถบเมนูด้านบน กดเลือก **Help > About Winamp**
3. ในช่อง **Backend Server IP (For Mobile APK)** ให้ลบ `http://localhost:4000` ออก แล้ววาง URL ของ Render:
   ```
   https://winamp-ytm-backend.onrender.com
   ```
4. กดปุ่ม **Save** (ระบบจะขึ้นว่า `✓ Saved!`)
5. กดปุ่ม **OK** เพื่อปิดหน้าต่าง

🎉 **เสร็จสมบูรณ์!** ตอนนี้โทรศัพท์มือถือของคุณสามารถค้นหาเพลง สตรีมเพลง YouTube Music และปรับแต่งเสียงได้ทุกที่ ไม่ว่าจะต่อ Wi-Fi หรือใช้เน็ตมือถือ 4G/5G โดยไม่ต้องเปิดคอมพิวเตอร์ที่บ้านทิ้งไว้อีกต่อไป!

---

## 💡 ทริกสำคัญ: การทำงานของ Render Free Tier

> **ระบบพักเครื่อง (Spin Down):**
> บน Render Free Tier หากไม่มีการใช้งานเกิน **15 นาที** เซิร์ฟเวอร์จะเข้าสู่โหมดพัก (Sleep) เพื่อประหยัดพลังงาน
> 
> เมื่อคุณเปิดแอพ Winamp มาค้นหาเพลงครั้งแรกหลังจากที่เซิร์ฟเวอร์หลับ:
> - การค้นหาเพลงครั้งแรกอาจใช้เวลาประมาณ **30 - 50 วินาที** เพื่อรอให้เซิร์ฟเวอร์ตื่น (Cold Start)
> - หลังจากตื่นแล้ว จะเล่นเพลงและสตรีมมิ่งได้ลื่นไหลปกติทันที

> **วิธีทำให้เซิร์ฟเวอร์ตื่นตลอด 24 ชั่วโมง (ไม่ต้องรอ Cold Start):**
> คุณสามารถใช้บริการฟรี เช่น **[UptimeRobot.com](https://uptimerobot.com)** หรือ **[Cron-job.org](https://cron-job.org)**:
> 1. สมัครฟรี แล้วสร้าง HTTP Monitor ใหม่
> 2. ใส่ URL Health Check: `https://winamp-ytm-backend.onrender.com/api/health`
> 3. ตั้งเวลาให้สะกิด Ping ทุกๆ **10 นาที**
> 4. เพียงเท่านี้ Render จะไม่หลับ และเปิดแอพในมือถือมากดฟังเพลงได้ทันทีตลอด 24 ชั่วโมงครับ!
