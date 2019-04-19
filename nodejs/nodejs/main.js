const fs = require('fs');
const Solution = require('./Solution');

async function main() {
	const [, , inputFile, outputFile, timeFile, tempDir] = process.argv; // 从命令行参数中获取:输入文件、输出文件、可读写临时目录
	const NS_PER_SEC = 1e9; //1 s = 1 * 1e9 ns

	if (!inputFile || !outputFile || !timeFile || !tempDir) {
		console.warn(`usage : inputFile outputFile timeFile tempDir`);
		process.exit();
	}
	//创建输出流
	const writable = fs.createWriteStream(outputFile);

	writable.on('error', (err) => {
		console.error(err);
	});

	try {
		//创建solution
		const solution = new Solution();
		// 初始化程序
		solution.init(tempDir);


		const timestamp = process.hrtime();
		//执行主体
		await solution.process(inputFile, (data) => {
			return writable.write(data.join(',') + '\n');
		});
		const diff = process.hrtime(timestamp);

		//写入结束
		writable.end();

		writable.on('finish', function () {
			//写入时间
			fs.writeFileSync(timeFile, Math.round((diff[0] * NS_PER_SEC + diff[1]) / 1000)); //ns => us

			process.exit();
		});

		console.log('Time:' + Math.round((diff[0] * NS_PER_SEC + diff[1]) / NS_PER_SEC) + 's');

	} catch (error) {
		console.error(error);
		process.exit();
	}
}

main();