import SwiftUI

struct ContentView: View {
  var body: some View {
    CardListView()
      .background(WatchColor.ground)
      .ignoresSafeArea()
  }
}

#Preview {
  ContentView()
}