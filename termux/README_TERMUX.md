# คู่มือการติดตั้งและใช้งาน Backend Winamp YTM บน Termux (Android)

คู่มือนี้สำหรับใช้งาน Backend (`server.js`) ร่วมกับแอป **Winamp YTM** บนมือถือ Android โดยระบบจะ:
- 🚀 **เปิดแอป Winamp** -> ระบบจะเรียกสคริปต์ใน Termux เปิด Backend อัตโนมัติ (พอร์ต `4000`)
- 🛑 **ปิดแอป Winamp** -> ระบบจะสั่ง Terminate หยุด Process ของ Node.js ใน Termux ทันที (ป้องกันการกินแบตเตอรี่และ RAM ค้าง)

---

## 1. การเตรียมตัวครั้งแรก (ทำครั้งเดียว)

### ขั้นตอนที่ 1: ติดตั้ง Termux จาก F-Droid
> ⚠️ **คำเตือน**: ห้ามโหลด Termux จาก Google Play Store เพราะเวอร์ชันนั้นเก่าและถูกจำกัดสิทธิ์ Android Intent
- ดาวน์โหลด Termux ได้ฟรีจาก **[F-Droid](https://f-droid.org/en/packages/com.termux/)** หรือ **[GitHub Releases](https://github.com/termux/termux-app/releases)**

---

### ขั้นตอนที่ 2: รันคำสั่ง Setup อัตโนมัติใน Termux
เปิดแอป Termux บนมือถือ แล้วคัดลอกคำสั่งด้านล่างนี้ไปวางแล้วกด Enter:

```bash
# 1. อนุญาตให้เข้าถึงพื้นที่จัดเก็บข้อมูล (กด Allow บนจอมือถือ)
termux-setup-storage

# 2. ติดตั้ง Node.js, Git และเครื่องมือจัดการโปรเซส
pkg update -y && pkg install -y nodejs-lts git psmisc procps

# 3. เปิดสิทธิ์ให้แอปภายนอก (Winamp YTM) สั่งรันคำสั่งได้
mkdir -p ~/.termux
echo "allow-external-apps = true" >> ~/.termux/termux.properties
termux-reload-settings
```

---

### ขั้นตอนที่ 3: ดึงโฟลเดอร์โปรเจกต์และติดตั้ง Dependencies
ใน Termux ให้ดาวน์โหลดหรือก๊อบปี้โฟลเดอร์ `winamp-ytm-app` มาไว้ที่ Home:

```bash
# กรณีโคลนผ่าน Git (หรือคัดลอกโฟลเดอร์มาไว้ที่ ~/winamp-ytm-app):
cd ~
git clone https://github.com/YOUR_USERNAME/winamp-ytm-app.git

# ติดตั้งแพ็กเกจของ Backend
cd ~/winamp-ytm-app/server
npm install --omit=dev

# ติดตั้งสคริปต์ควบคุม Start / Stop ไปที่ ~/bin/
mkdir -p ~/bin
cp ~/winamp-ytm-app/termux/start_winamp_backend.sh ~/bin/
cp ~/winamp-ytm-app/termux/stop_winamp_backend.sh ~/bin/
chmod +x ~/bin/start_winamp_backend.sh ~/bin/stop_winamp_backend.sh
```

---

## 2. วิธีใช้งานจริงในชีวิตประจำวัน

เมื่อตั้งค่าเสร็จแล้ว **คุณไม่ต้องเปิดแอป Termux พิมพ์คำสั่งเองอีกต่อไป**:

1. **แตะเปิดแอป Winamp YTM บนหน้าจอมือถือ**:
   - แอป Winamp จะส่งสัญญาณ Intent ไปยัง Termux เพื่อสั่ง `node server.js` ในเบื้องหลังทันที
   - แถบเมนูด้านบนขวาของ Winamp จะแสดงสถานะ `[● SRV]` สีเขียว พร้อมค้นหาและสตรีมเพลง YouTube ได้ทันที
2. **เมื่อเลิกใช้งาน**:
   - **วิธีที่ 1**: ปัดปิดแอป Winamp ออกจากหน้าจอ Recent Apps
   - **วิธีที่ 2**: กดเมนู **File -> Exit & Stop Backend** ในแอป Winamp
   - **วิธีที่ 3**: กดย้อนกลับ (Back Button) ออกจากหน้าจอหลัก
   - ⚡ **ผลลัพธ์**: Backend จะส่งสัญญาณปิดตัว (`/api/shutdown`) และ Termux จะสั่ง `pkill` ล้างโปรเซส Node.js และคืนพอร์ต 4000 ทันที 100% ไม่มีทางที่แบตเตอรี่จะรั่วไหล

---

## 3. ระบบป้องกันการทำงานค้าง (Triple-Lock Safety)

หากเกิดเหตุการณ์โทรศัพท์ดับ แบตเตอรี่หมด หรือแอปแครชกะทันหัน:
- **Watchdog Timer 60 วินาที**: ตัว Server มีระบบตรวจจับสัญญาณ Heartbeat อัตโนมัติ หากไม่มีการติดต่อจากแอป Winamp เกิน 60 วินาที ตัว Server จะสั่ง `process.exit(0)` ดับตัวเองโดยอัตโนมัติ

---

## 4. คำสั่งทดสอบด้วยตนเองใน Termux (Manual Testing)

หากต้องการทดสอบด้วยตัวเองใน Termux สามารถใช้คำสั่งเหล่านี้ได้:

```bash
# ทดสอบเปิด Backend
bash ~/bin/start_winamp_backend.sh

# ตรวจสอบว่าพอร์ต 4000 กำลังรันอยู่หรือไม่
curl http://localhost:4000/api/health

# ดู Log การทำงานของ Backend
cat ~/winamp_backend.log

# ทดสอบปิด Backend
bash ~/bin/stop_winamp_backend.sh
```
