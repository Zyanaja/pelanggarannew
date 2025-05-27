let html5QrCode;
let currentScannedStudent = null;
let isQrScannerRunning = false;

// Dapatkan referensi tombol
const startScanBtn = document.getElementById('startScanBtn');
const stopScanBtn = document.getElementById('stopScanBtn');
const qrReaderResults = document.getElementById('qr-reader-results');
const qrReaderDiv = document.getElementById('qr-reader');
const pelanggaranForm = document.getElementById('pelanggaran-form');

// --- FUNGSI NAVIGASI ---
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(sectionId + '-section').style.display = 'block';
    document.getElementById('btn-' + sectionId).classList.add('active');

    if (sectionId === 'guru') {
        // Jangan langsung start scanner, biarkan user klik tombol
        resetGuruSectionState(); // Reset tampilan guru setiap kali masuk
    } else {
        stopQrScanner(); // Pastikan scanner mati jika pindah ke bagian siswa
    }
}

// --- FUNGSI UNTUK BAGIAN SISWA (QR CODE GENERATOR) ---
function generateQRCode() {
    const nama = document.getElementById('namaSiswa').value.trim();
    const kelas = document.getElementById('kelasSiswa').value.trim();
    const jurusan = document.getElementById('jurusanSiswa').value.trim();

    if (!nama || !kelas) {
        alert('Nama dan Kelas harus diisi!');
        return;
    }

    const dataSiswa = {
        nama: nama,
        kelas: kelas,
        jurusan: jurusan || '-'
    };

    const dataString = JSON.stringify(dataSiswa);

    const qrcodeContainer = document.getElementById('qrcode');
    qrcodeContainer.innerHTML = '';

    new QRCode(qrcodeContainer, {
        text: dataString,
        width: 256,
        height: 256,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });

    alert('QR Code berhasil dibuat! Silakan screenshot atau cetak.');
}

// --- FUNGSI UNTUK BAGIAN GURU (QR CODE SCANNER & PELANGGARAN) ---

// Inisialisasi html5QrCode di luar fungsi start/stop
// Ini membantu agar instansi Html5Qrcode bisa digunakan ulang
html5QrCode = new Html5Qrcode("qr-reader");

startScanBtn.addEventListener('click', () => {
    startQrScanner();
});

stopScanBtn.addEventListener('click', () => {
    stopQrScanner();
});

function startQrScanner() {
    if (isQrScannerRunning) {
        qrReaderResults.innerText = 'Kamera sudah berjalan.';
        return;
    }

    qrReaderResults.innerText = 'Mencari kamera dan meminta izin...';
    pelanggaranForm.style.display = 'none'; // Sembunyikan form pelanggaran saat scan dimulai

    // Sembunyikan placeholder text
    const placeholderText = qrReaderDiv.querySelector('.qr-placeholder-text');
    if (placeholderText) {
        placeholderText.style.display = 'none';
    }
    
    // Pastikan tombol display-nya benar
    startScanBtn.style.display = 'none';
    stopScanBtn.style.display = 'block';

    Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length) {
            // Pilih kamera belakang jika ada, atau kamera pertama
            const cameraId = devices.find(device => device.label.toLowerCase().includes('back'))?.id || devices[0].id;
            
            html5QrCode.start(
                cameraId,
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText, decodedResult) => {
                    // Berhasil scan!
                    console.log(`Code matched = ${decodedText}`, decodedResult);
                    try {
                        const studentData = JSON.parse(decodedText);
                        document.getElementById('scannedNama').innerText = studentData.nama;
                        document.getElementById('scannedKelas').innerText = studentData.kelas;
                        document.getElementById('scannedJurusan').innerText = studentData.jurusan;
                        qrReaderResults.innerText = `QR Code berhasil dipindai! Siswa: ${studentData.nama}`;
                        pelanggaranForm.style.display = 'block';
                        currentScannedStudent = studentData; // Simpan data siswa

                        // Hentikan scanner setelah berhasil scan agar tidak terus berjalan
                        stopQrScanner(); 
                    } catch (e) {
                        qrReaderResults.innerText = 'Data QR tidak valid!';
                        console.error('Error parsing QR data:', e);
                    }
                },
                (errorMessage) => {
                    // Pesan ini normal saat kamera mencari QR code
                    // console.warn(`QR Code no match = ${errorMessage}`);
                }
            ).then(() => {
                isQrScannerRunning = true;
                qrReaderResults.innerText = 'Kamera aktif. Silakan arahkan QR Code.';
                // Perlu sedikit delay untuk memastikan video element sudah ada sebelum diakses
                setTimeout(() => {
                    const videoElement = qrReaderDiv.querySelector('video');
                    if (videoElement) {
                        videoElement.style.display = 'block';
                    }
                }, 100);
            }).catch((err) => {
                console.error(`Gagal memulai kamera:`, err);
                qrReaderResults.innerText = 'Gagal memulai kamera. Pastikan memberikan izin akses kamera dan tidak ada aplikasi lain yang menggunakan kamera. Error: ' + err.message;
                isQrScannerRunning = false;
                startScanBtn.style.display = 'block'; // Tampilkan lagi tombol start
                stopScanBtn.style.display = 'none';
                if (placeholderText) placeholderText.style.display = 'block'; // Tampilkan placeholder
            });
        } else {
            qrReaderResults.innerText = 'Tidak ada kamera yang ditemukan di perangkat Anda.';
            alert('Tidak ada kamera yang ditemukan.');
            isQrScannerRunning = false;
            startScanBtn.style.display = 'block';
            stopScanBtn.style.display = 'none';
            if (placeholderText) placeholderText.style.display = 'block';
        }
    }).catch(err => {
        console.error('Error mendapatkan daftar kamera:', err);
        qrReaderResults.innerText = 'Gagal mengakses daftar kamera. Periksa izin browser.';
        isQrScannerRunning = false;
        startScanBtn.style.display = 'block';
        stopScanBtn.style.display = 'none';
        if (placeholderText) placeholderText.style.display = 'block';
    });
}

function stopQrScanner() {
    if (html5QrCode.is  Scanning) { // Pastikan scanner memang sedang berjalan
        html5QrCode.stop().then(() => {
            console.log("QR Code scanning stopped.");
            isQrScannerRunning = false;
            qrReaderResults.innerText = 'Scan kamera dihentikan.';
            pelanggaranForm.style.display = 'none'; // Sembunyikan form pelanggaran
            startScanBtn.style.display = 'block'; // Tampilkan tombol start
            stopScanBtn.style.display = 'none'; // Sembunyikan tombol stop
            const videoElement = qrReaderDiv.querySelector('video');
            if (videoElement) { // Sembunyikan video kamera
                videoElement.style.display = 'none';
            }
            const placeholderText = qrReaderDiv.querySelector('.qr-placeholder-text');
            if (placeholderText) placeholderText.style.display = 'block'; // Tampilkan placeholder
        }).catch((err) => {
            console.error("Gagal menghentikan scan:", err);
            qrReaderResults.innerText = 'Gagal menghentikan kamera.';
        });
    } else {
        qrReaderResults.innerText = 'Kamera tidak sedang berjalan.';
        startScanBtn.style.display = 'block'; // Pastikan tombol start terlihat jika tidak berjalan
        stopScanBtn.style.display = 'none';
    }
}

function resetGuruSectionState() {
    // Reset tampilan awal bagian guru
    stopQrScanner(); // Pastikan scanner mati
    document.getElementById('scannedNama').innerText = '';
    document.getElementById('scannedKelas').innerText = '';
    document.getElementById('scannedJurusan').innerText = '';
    qrReaderResults.innerText = 'Klik "Mulai Scan Kamera" untuk memindai.';
    pelanggaranForm.style.display = 'none';
    document.querySelectorAll('input[name="pelanggaran"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    currentScannedStudent = null;
    startScanBtn.style.display = 'block';
    stopScanBtn.style.display = 'none';
    const placeholderText = qrReaderDiv.querySelector('.qr-placeholder-text');
    if (placeholderText) placeholderText.style.display = 'block';
    const videoElement = qrReaderDiv.querySelector('video');
    if (videoElement) videoElement.style.display = 'none';
}


// --- FUNGSI MENYIMPAN DATA PELANGGARAN ---
let pelanggaranData = JSON.parse(localStorage.getItem('pelanggaranData')) || [];

function recordPelanggaran() {
    if (!currentScannedStudent) {
        alert('Silakan scan QR siswa terlebih dahulu!');
        return;
    }

    const selectedPelanggaran = [];
    document.querySelectorAll('input[name="pelanggaran"]:checked').forEach(checkbox => {
        selectedPelanggaran.push(checkbox.value);
    });

    if (selectedPelanggaran.length === 0) {
        alert('Pilih setidaknya satu jenis pelanggaran!');
        return;
    }

    const newRecord = {
        nama: currentScannedStudent.nama,
        kelas: currentScannedStudent.kelas,
        jurusan: currentScannedStudent.jurusan,
        pelanggaran: selectedPelanggaran.join(', '),
        waktu: new Date().toLocaleString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) // Format waktu lebih spesifik
    };

    pelanggaranData.push(newRecord);
    localStorage.setItem('pelanggaranData', JSON.stringify(pelanggaranData));

    renderPelanggaranList();
    resetPelanggaranForm();
    alert('Pelanggaran berhasil dicatat!');
}

function renderPelanggaranList() {
    const tableBody = document.querySelector('#pelanggaran-list tbody');
    tableBody.innerHTML = '';

    const noDataMessage = document.getElementById('no-data-message');
    if (pelanggaranData.length === 0) {
        noDataMessage.style.display = 'block';
    } else {
        noDataMessage.style.display = 'none';
    }

    pelanggaranData.forEach(record => {
        const row = tableBody.insertRow();
        row.insertCell().innerText = record.nama;
        row.insertCell().innerText = record.kelas;
        row.insertCell().innerText = record.jurusan;
        row.insertCell().innerText = record.pelanggaran;
        row.insertCell().innerText = record.waktu;
    });
}

function resetPelanggaranForm() {
    document.getElementById('scannedNama').innerText = '';
    document.getElementById('scannedKelas').innerText = '';
    document.getElementById('scannedJurusan').innerText = '';
    // Tidak reset qrReaderResults dan form-pelanggaran display, biarkan seperti di stopQrScanner
    document.querySelectorAll('input[name="pelanggaran"]:checked').forEach(checkbox => {
        checkbox.checked = false;
    });
    currentScannedStudent = null;
    // Biarkan guru yang memulai scan lagi dengan tombol start
}

// --- FUNGSI EKSPOR KE SPREADSHEET (CSV) ---
function exportToSpreadsheet() {
    if (pelanggaranData.length === 0) {
        alert('Tidak ada data pelanggaran untuk diekspor!');
        return;
    }

    const headers = ["Nama", "Kelas", "Jurusan", "Pelanggaran", "Waktu"];
    const csvRows = [];

    csvRows.push(headers.map(h => `"${h}"`).join(','));

    pelanggaranData.forEach(record => {
        const values = [
            `"${record.nama.replace(/"/g, '""')}"`,
            `"${record.kelas.replace(/"/g, '""')}"`,
            `"${record.jurusan.replace(/"/g, '""')}"`,
            `"${record.pelanggaran.replace(/"/g, '""')}"`,
            `"${record.waktu.replace(/"/g, '""')}"`
        ];
        csvRows.push(values.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'data_pelanggaran_siswa.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert('Data berhasil diekspor ke file CSV!');
}

// --- INITIAL LOAD ---
document.addEventListener('DOMContentLoaded', () => {
    renderPelanggaranList();
    showSection('siswa'); // Tampilkan bagian siswa secara default saat pertama kali loading
});
