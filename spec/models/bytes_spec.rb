require "rails_helper"

describe Bytes do
  let(:bytes) do
    [
       112, 99, 112, 10, # type(4byte)
         4,  0,   0,  0, # size(4byte)
         1,  0,   0,  0, # data(4byte)
    ].to_bytes
  end

  describe '#[]' do
    it { expect(bytes[0..3].to_a).to eq [112, 99, 112, 10] }
  end

  describe '#substring' do
    subject { bytes.substring(start, length).to_a }

    let(:byte_array) do
      [112, 99, 112, 10, # type(4byte)
         4,  0,   0,  0, # size(4byte)
         1,  0,   0,  0] # data(4byte)
    end
    let(:bytes) { byte_array.to_bytes }

    context '開始位置が最初' do
      let(:start) { 0 }
      let(:length) { 4 }
      it { is_expected.to eq [112, 99, 112, 10] }
    end

    context '開始位置が途中' do
      let(:start) { 4 }
      let(:length) { 4 }
      it { is_expected.to eq [4, 0, 0, 0] }
    end
  end

  describe '#to_i' do
    subject { bytes.to_i }

    context '1桁目だけの場合' do
      let(:bytes) { [1, 0, 0, 0].to_bytes }
      it { is_expected.to eq 1 }
    end

    context '2桁目だけの場合' do
      let(:bytes) { [0, 1, 0, 0].to_bytes }
      it { is_expected.to eq 256 }
    end

    context '3桁目だけの場合' do
      let(:bytes) { [0, 0, 1, 0].to_bytes }
      it { is_expected.to eq 65536 }
    end

    context '4桁目だけの場合' do
      let(:bytes) { [0, 0, 0, 1].to_bytes }
      it { is_expected.to eq 16777216 }
    end

    context '1〜4桁の場合' do
      let(:bytes) { [1, 1, 1, 1].to_bytes }
      it { is_expected.to eq 1 + 256 + 65536 + 16777216 }
    end
  end

  describe '#to_s' do
    subject { bytes.to_s }
    let(:bytes) { [112, 99, 112, 10].to_bytes }
    it { is_expected.to eq "pcp\n" }
  end
end
