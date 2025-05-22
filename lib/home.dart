import 'dart:async';
import 'dart:math';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:syncfusion_flutter_gauges/gauges.dart';

class HomePage extends StatefulWidget {
  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  List<FlSpot> chartData = [];
  double btcPrice = 63000.00;
  int _time = 0;
  late Timer _timer;

  @override
  void initState() {
    super.initState();
    _startUpdatingData();
  }

  void _startUpdatingData() {
    _timer = Timer.periodic(Duration(seconds: 2), (timer) {
      setState(() {
        _time += 1;
        btcPrice = 62000 + Random().nextDouble() * 2000; // Simulated price
        chartData.add(FlSpot(_time.toDouble(), btcPrice));
        if (chartData.length > 20) chartData.removeAt(0);
      });
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: Colors.black,
        cardColor: Colors.grey[900],
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.orangeAccent,
            foregroundColor: Colors.black,
          ),
        ),
      ),
      home: Scaffold(
        appBar: AppBar(
          title: Text('BTC Mining'),
          backgroundColor: Colors.black,
        ),
        body: Padding(
          padding: const EdgeInsets.all(12.0),
          child: SingleChildScrollView(
            child: Column(
              children: [

                // Top BTC Info + Chart Box
                Card(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: 8,
                  child: Container(
                    height: 200,
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        // Line Chart placeholder
                        Expanded(
                          flex: 2,
                          child: Container(
                            decoration: BoxDecoration(
                              color: Colors.grey[850],
                              borderRadius: BorderRadius.circular(12),
                            ),
                            padding: EdgeInsets.all(8),
                            child: LineChart(
                              LineChartData(
                                backgroundColor: Colors.grey[850],
                                gridData: FlGridData(show: false),
                                titlesData: FlTitlesData(show: false),
                                borderData: FlBorderData(show: false),
                                lineBarsData: [
                                  LineChartBarData(
                                    spots: chartData,
                                    isCurved: true,
                                    color: Colors.orangeAccent,
                                    barWidth: 2,
                                    dotData: FlDotData(show: false),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        SizedBox(width: 12),
                        // BTC Info
                        Expanded(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.currency_bitcoin, size: 48, color: Colors.orangeAccent),
                              SizedBox(height: 10),
                              Text(
                                '\$${btcPrice.toStringAsFixed(2)}',
                                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                              ),
                              Text(
                                'BTC Live Price',
                                style: TextStyle(color: Colors.grey),
                              )
                            ],
                          ),
                        )
                      ],
                    ),
                  ),
                ),

                SizedBox(height: 16),

                // Wallet & Referral Balances
                Row(
                  children: [
                    Expanded(
                      child: Card(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 6,
                        child: Container(
                          height: 80,
                          alignment: Alignment.center,
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text('Wallet Balance'),
                              SizedBox(height: 4),
                              Text(
                                '0.0000000000',
                                style: TextStyle(fontWeight: FontWeight.bold),
                              )
                            ],
                          ),
                        ),
                      ),
                    ),
                    SizedBox(width: 12),
                    Expanded(
                      child: Card(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 6,
                        child: Container(
                          height: 80,
                          alignment: Alignment.center,
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text('Referral Balance'),
                              SizedBox(height: 4),
                              Text(
                                '0.0000000000',
                                style: TextStyle(fontWeight: FontWeight.bold),
                              )
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),

                SizedBox(height: 16),

                // Mining Power & Speedometer
                Card(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 6,
                  child: Container(
                    height: 120,
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text('Current Mining Power', style: TextStyle(fontSize: 16)),
                            SizedBox(height: 8),
                            Text('20 Gh/s', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                          ],
                        ),
                        Container(
                          width: 120,
                          height: 120,
                          child: SfRadialGauge(
                            axes: <RadialAxis>[
                              RadialAxis(
                                minimum: 0,
                                maximum: 100,
                                showLabels: false,
                                showTicks: false,
                                axisLineStyle: AxisLineStyle(
                                  thickness: 0.15,
                                  cornerStyle: CornerStyle.bothFlat,
                                  color: Colors.grey[700],
                                  thicknessUnit: GaugeSizeUnit.factor,
                                ),
                                pointers: <GaugePointer>[
                                  NeedlePointer(
                                    value: 35,
                                    enableAnimation: true,
                                    animationDuration: 800,
                                    needleLength: 0.8,
                                    lengthUnit: GaugeSizeUnit.factor,
                                    needleStartWidth: 0,
                                    needleEndWidth: 4,
                                    needleColor: Colors.orangeAccent,
                                    knobStyle: KnobStyle(
                                      color: Colors.black,
                                      borderColor: Colors.orangeAccent,
                                      borderWidth: 2,
                                      sizeUnit: GaugeSizeUnit.logicalPixel,
                                      knobRadius: 8,
                                    ),
                                  ),
                                ],
                                ranges: <GaugeRange>[
                                  GaugeRange(
                                    startValue: 0,
                                    endValue: 100,
                                    color: Colors.orangeAccent.withOpacity(0.5),
                                    startWidth: 0.15,
                                    endWidth: 0.15,
                                    sizeUnit: GaugeSizeUnit.factor,
                                  )
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                SizedBox(height: 16),

                // Hashpower Claim Options
                Card(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 6,
                  child: Padding(
                    padding: const EdgeInsets.all(12.0),
                    child: Column(
                      children: [
                        // Daily Claim
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Claim Daily Free Hashpower'),
                            ElevatedButton(
                              onPressed: () {},
                              child: Text('Claim'),
                            ),
                          ],
                        ),
                        Divider(),
                        // Watch Ad
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Watch Ad (35/day)'),
                            ElevatedButton(
                              onPressed: () {},
                              child: Text('Watch'),
                            ),
                          ],
                        ),
                        Divider(),
                        // Buy Hashpower
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Buy More Hashpower'),
                            ElevatedButton(
                              onPressed: () {
                              },
                              child: Text('Buy'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        bottomNavigationBar: BottomNavigationBar(
          backgroundColor: Colors.black,
          selectedItemColor: Colors.orangeAccent,
          unselectedItemColor: Colors.grey,
          type: BottomNavigationBarType.fixed,
          currentIndex: 0,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.account_balance_wallet),
              label: 'Wallet',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.store),
              label: 'Store',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}
